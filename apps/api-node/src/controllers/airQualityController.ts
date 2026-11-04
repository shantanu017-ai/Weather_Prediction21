import { Request, Response } from 'express';
import { dataService } from '../services/dataService';
import { mlClient } from '../services/mlClient';
import { calculateOverallAQI } from '@gp01/shared';

export const getCurrentAirQuality = async (req: Request, res: Response) => {
  try {
    const { stationId, lat, lon } = req.query;

    if (stationId) {
      const station = dataService.getStationById(stationId as string);
      if (!station) {
        return res.status(404).json({ success: false, error: 'Station not found' });
      }
      return res.json({
        success: true,
        station,
        measurement: station.latestMeasurement
      });
    }

    const latitude = parseFloat(lat as string || '16.6775');
    const longitude = parseFloat(lon as string || '74.2541');

    // Find nearest station
    const allStations = dataService.getStations();
    let nearest = allStations[0];
    let minDist = 999999;
    for (const st of allStations) {
      const d = Math.hypot(st.location.latitude - latitude, st.location.longitude - longitude);
      if (d < minDist) {
        minDist = d;
        nearest = st;
      }
    }

    return res.json({
      success: true,
      queryLocation: { latitude, longitude },
      nearestStation: nearest,
      measurement: nearest.latestMeasurement
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const predictAirQuality = async (req: Request, res: Response) => {
  try {
    const features = req.body;
    const prediction = await mlClient.predictConcentrations(features);
    const aqi = await mlClient.calculateAQI({
      pm25: prediction.predicted_pm25,
      pm10: prediction.predicted_pm10
    });

    return res.json({
      success: true,
      prediction,
      aqi
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getSourceAttribution = async (req: Request, res: Response) => {
  try {
    const { stationId, lat, lon } = req.query;
    let targetStation = stationId ? dataService.getStationById(stationId as string) : undefined;
    
    let latitude = targetStation?.location.latitude || parseFloat(lat as string || '16.6775');
    let longitude = targetStation?.location.longitude || parseFloat(lon as string || '74.2541');

    if (!targetStation) {
      const allStations = dataService.getStations();
      targetStation = allStations[0];
    }

    const latest = targetStation.latestMeasurement;
    const weather = dataService.getLatestWeather(latitude, longitude);
    const fires = dataService.getActiveFires();

    const isIndustrial = targetStation.id.includes('midc');
    const isHighway = targetStation.id.includes('nh48') || targetStation.id.includes('bkc');

    const payload = {
      location: { latitude, longitude },
      pm25: latest?.pm25 || 55,
      pm10: latest?.pm10 || 110,
      no2: latest?.no2 || 35,
      so2: latest?.so2 || 15,
      co: latest?.co || 1.2,
      temperature: weather.temperature2m,
      humidity: weather.relativeHumidity2m,
      wind_speed: weather.windSpeed10m,
      wind_direction: weather.windDirection10m,
      boundary_layer_height: weather.boundaryLayerHeight || 650,
      hour_of_day: new Date().getUTCHours() + 5, // approx IST
      nearby_fires: fires,
      is_industrial_zone: isIndustrial,
      is_highway_corridor: isHighway
    };

    const attribution = await mlClient.analyzeAttribution(payload);
    attribution.stationId = targetStation.id;
    attribution.stationName = targetStation.name;

    return res.json({
      success: true,
      station: targetStation,
      weather,
      attribution
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getPollutionHotspots = async (req: Request, res: Response) => {
  try {
    const stations = dataService.getStations();
    const points = stations.map(s => ({
      station_id: s.id,
      latitude: s.location.latitude,
      longitude: s.location.longitude,
      pm25: s.latestMeasurement?.pm25 || 45,
      pm10: s.latestMeasurement?.pm10 || 90,
      aqi: s.latestMeasurement?.aqi || 110
    }));

    const hotspots = await mlClient.getHotspots(points);
    return res.json({
      success: true,
      count: hotspots.length,
      data: hotspots
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getFires = async (req: Request, res: Response) => {
  try {
    const fires = dataService.getActiveFires();
    return res.json({
      success: true,
      count: fires.length,
      data: fires
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getWeather = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string || '16.6775');
    const lon = parseFloat(req.query.lon as string || '74.2541');
    const weather = dataService.getLatestWeather(lat, lon);
    return res.json({
      success: true,
      data: weather
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getForecast = async (req: Request, res: Response) => {
  try {
    const stationId = (req.query.stationId as string) || 'kolhapur-shivaji-uni';
    const history = dataService.getStationHistory(stationId, 48);
    const forecast = await mlClient.getForecast(history);
    return res.json({
      success: true,
      stationId,
      forecast
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
