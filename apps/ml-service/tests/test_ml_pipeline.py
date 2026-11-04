import os
import sys
import unittest

# Ensure app is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.cpcb_engine import evaluate_cpcb_aqi, calculate_pollutant_sub_index
from app.services.source_attribution import evaluate_probabilistic_attribution
from app.services.hotspot_detector import detect_spatial_hotspots
from app.models.regressor import ConcentrationEstimator, TimeSeriesForecaster
from app.schemas.ml_schemas import (
    ConcentrationFeaturesInput,
    SourceAttributionInput,
    NearbyFireInput,
    SpatialHotspotInput,
    HotspotStationPoint,
    ForecastHistoryInput,
    TimeSeriesHistoryPoint,
    GeoPoint
)

class TestAirQualityMLPipeline(unittest.TestCase):
    def setUp(self):
        self.estimator = ConcentrationEstimator()
        self.forecaster = TimeSeriesForecaster()

    def test_cpcb_sub_index_breakpoints(self):
        # PM2.5 tests
        self.assertEqual(calculate_pollutant_sub_index('pm25', 15.0), 25)
        self.assertEqual(calculate_pollutant_sub_index('pm25', 30.0), 50)
        self.assertEqual(calculate_pollutant_sub_index('pm25', 60.0), 100)
        self.assertEqual(calculate_pollutant_sub_index('pm25', 75.0), 149)
        self.assertEqual(calculate_pollutant_sub_index('pm25', 120.0), 300)
        self.assertEqual(calculate_pollutant_sub_index('pm25', 250.0), 400)

        # Invalid or missing
        self.assertIsNone(calculate_pollutant_sub_index('pm25', None))
        self.assertIsNone(calculate_pollutant_sub_index('pm25', -5.0))

    def test_cpcb_overall_aqi(self):
        res = evaluate_cpcb_aqi({
            'pm25': 65.0,
            'pm10': 90.0,
            'no2': 35.0
        })
        self.assertTrue(res['is_valid'])
        self.assertEqual(res['dominant_pollutant'], 'PM25')
        self.assertEqual(res['category'], 'Moderate')

    def test_concentration_prediction_lightgbm(self):
        inp = ConcentrationFeaturesInput(
            latitude=16.6775,
            longitude=74.2541,
            aod_550nm=0.65,
            tropospheric_no2=0.00005,
            temperature_2m=28.0,
            relative_humidity_2m=55.0,
            wind_speed_10m=2.5,
            wind_direction_10m=240.0,
            surface_pressure=1012.0,
            boundary_layer_height=700.0,
            cloud_fraction=0.1,
            hour_of_day=10,
            day_of_week=2
        )
        pred = self.estimator.predict(inp)
        self.assertGreater(pred.predicted_pm25, 0.0)
        self.assertGreater(pred.predicted_pm10, pred.predicted_pm25)
        self.assertIn("pm25", pred.confidence_interval)
        self.assertIn("pm10", pred.confidence_interval)

    def test_source_attribution_traffic_scenario(self):
        inp = SourceAttributionInput(
            location=GeoPoint(latitude=16.711, longitude=74.262),
            pm25=68.0,
            pm10=110.0,
            no2=75.0, # High NO2
            so2=12.0,
            co=1.2,
            temperature=27.0,
            humidity=50.0,
            wind_speed=2.2,
            wind_direction=230.0,
            boundary_layer_height=600.0,
            hour_of_day=9, # Morning rush hour
            nearby_fires=[],
            is_highway_corridor=True
        )
        res = evaluate_probabilistic_attribution(inp)
        self.assertEqual(res.dominant_source, "Vehicular Traffic")
        self.assertGreater(res.scores.traffic, res.scores.industrial)
        self.assertGreater(res.confidence, 50.0)
        # Check evidence contains NO2 and rush hour
        metrics = [e.metric for e in res.evidence]
        self.assertTrue(any("Rush Hour" in m for m in metrics))
        self.assertTrue(any("NO2" in m for m in metrics))

    def test_source_attribution_biomass_scenario(self):
        # Fire is at (16.61, 74.20), station is at (16.68, 74.25).
        # Bearing from fire to station is approx 35 deg.
        # If wind direction is approx 215 deg (blowing from SW towards NE), it blows towards station!
        inp = SourceAttributionInput(
            location=GeoPoint(latitude=16.68, longitude=74.25),
            pm25=85.0,
            pm10=120.0,
            no2=25.0,
            so2=10.0,
            co=2.4, # High CO
            temperature=25.0,
            humidity=45.0,
            wind_speed=3.0,
            wind_direction=215.0,
            boundary_layer_height=500.0,
            hour_of_day=14,
            nearby_fires=[
                NearbyFireInput(latitude=16.61, longitude=74.20, frp=35.0, confidence="high")
            ]
        )
        res = evaluate_probabilistic_attribution(inp)
        self.assertEqual(res.dominant_source, "Crop Residue & Biomass Burning")
        self.assertGreater(res.scores.biomass, res.scores.dust)

    def test_source_attribution_industrial_scenario(self):
        inp = SourceAttributionInput(
            location=GeoPoint(latitude=16.745, longitude=74.280),
            pm25=75.0,
            pm10=145.0,
            no2=30.0,
            so2=55.0, # High SO2
            co=1.1,
            temperature=26.0,
            humidity=55.0,
            wind_speed=2.0,
            wind_direction=240.0,
            boundary_layer_height=400.0,
            hour_of_day=2,
            nearby_fires=[],
            is_industrial_zone=True
        )
        res = evaluate_probabilistic_attribution(inp)
        self.assertEqual(res.dominant_source, "Industrial Emissions")
        self.assertGreater(res.scores.industrial, res.scores.traffic)

    def test_source_attribution_dust_scenario(self):
        inp = SourceAttributionInput(
            location=GeoPoint(latitude=16.70, longitude=74.24),
            pm25=40.0,
            pm10=150.0, # PM10 / PM2.5 = 3.75 (coarse dominant)
            no2=20.0,
            so2=8.0,
            co=0.8,
            temperature=33.0,
            humidity=30.0, # dry
            wind_speed=4.5, # high wind
            wind_direction=260.0,
            boundary_layer_height=1100.0,
            hour_of_day=15,
            nearby_fires=[]
        )
        res = evaluate_probabilistic_attribution(inp)
        self.assertEqual(res.dominant_source, "Road & Construction Dust")
        self.assertGreater(res.scores.dust, res.scores.industrial)

    def test_spatial_hotspot_clustering(self):
        points = [
            HotspotStationPoint(station_id="s1", latitude=16.745, longitude=74.280, pm25=80.0, pm10=160.0, aqi=185),
            HotspotStationPoint(station_id="s2", latitude=16.750, longitude=74.285, pm25=85.0, pm10=170.0, aqi=195),
            HotspotStationPoint(station_id="s3", latitude=16.634, longitude=74.271, pm25=70.0, pm10=140.0, aqi=165),
            HotspotStationPoint(station_id="s4", latitude=16.638, longitude=74.275, pm25=72.0, pm10=145.0, aqi=170),
            HotspotStationPoint(station_id="s5", latitude=18.502, longitude=73.818, pm25=50.0, pm10=90.0, aqi=110), # Pune distant
        ]
        inp = SpatialHotspotInput(points=points, eps_km=15.0, min_samples=2)
        out = detect_spatial_hotspots(inp)
        self.assertGreaterEqual(out.clusters_count, 1)
        self.assertTrue(len(out.clusters[0].hull_coordinates) > 3)

    def test_timeseries_forecaster(self):
        history = [
            TimeSeriesHistoryPoint(timestamp=f"2026-11-04T{h:02d}:00:00Z", pm25=50.0, pm10=90.0, temperature=28.0, humidity=55.0, wind_speed=2.5)
            for h in range(12)
        ]
        inp = ForecastHistoryInput(history=history, horizon_hours=24)
        out = self.forecaster.forecast(inp)
        self.assertEqual(len(out.forecast), 24)
        self.assertGreater(out.forecast[0].pm25, 0.0)

    # Mandatory Edge Cases:
    def test_edge_case_sensor_drift_spike(self):
        # Extreme PM2.5 reading (e.g. 999.0 µg/m³)
        res = evaluate_cpcb_aqi({'pm25': 999.0})
        self.assertTrue(res['is_valid'])
        self.assertEqual(res['aqi'], 500)
        self.assertEqual(res['category'], 'Severe')

    def test_edge_case_empty_history_forecast(self):
        # Forecaster with zero history points
        inp = ForecastHistoryInput(history=[], horizon_hours=12)
        out = self.forecaster.forecast(inp)
        self.assertEqual(len(out.forecast), 12)

    def test_edge_case_missing_satellite_aod(self):
        # AOD is lower bound / missing
        inp = ConcentrationFeaturesInput(
            latitude=16.6775,
            longitude=74.2541,
            aod_550nm=0.1,
            tropospheric_no2=None,
            temperature_2m=25.0,
            relative_humidity_2m=60.0,
            wind_speed_10m=3.0,
            wind_direction_10m=220.0,
            surface_pressure=1012.0,
            boundary_layer_height=None,
            cloud_fraction=1.0, # heavy cloud
            hour_of_day=12,
            day_of_week=3
        )
        pred = self.estimator.predict(inp)
        self.assertGreater(pred.predicted_pm25, 0.0)

if __name__ == "__main__":
    unittest.main()
