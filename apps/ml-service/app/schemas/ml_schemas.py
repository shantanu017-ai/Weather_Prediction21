from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class GeoPoint(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class ConcentrationFeaturesInput(BaseModel):
    latitude: float
    longitude: float
    aod_550nm: float = Field(..., description="Aerosol Optical Depth (e.g. 0.2 to 1.5)")
    tropospheric_no2: Optional[float] = Field(None, description="Tropospheric NO2 column in mol/m2")
    temperature_2m: float = Field(..., description="Temperature in Celsius")
    relative_humidity_2m: float = Field(..., description="Relative humidity percentage")
    wind_speed_10m: float = Field(..., description="Wind speed in m/s")
    wind_direction_10m: float = Field(..., description="Wind direction in degrees (0-360)")
    surface_pressure: Optional[float] = Field(1013.25, description="Surface pressure in hPa")
    boundary_layer_height: Optional[float] = Field(800.0, description="Planetary boundary layer height in m")
    cloud_fraction: Optional[float] = Field(0.0, description="Cloud fraction (0.0 - 1.0)")
    hour_of_day: Optional[int] = Field(12, ge=0, le=23)
    day_of_week: Optional[int] = Field(2, ge=0, le=6)

class ConcentrationPredictionOutput(BaseModel):
    predicted_pm25: float
    predicted_pm10: float
    confidence_interval: Dict[str, Dict[str, float]]
    model_version: str
    feature_contributions: Dict[str, float]

class MultiPollutantInput(BaseModel):
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    o3: Optional[float] = None

class AQIResultOutput(BaseModel):
    aqi: Optional[int]
    category: Optional[str]
    dominant_pollutant: Optional[str]
    sub_indices: Dict[str, int]
    is_valid: bool
    status_note: Optional[str] = None

class NearbyFireInput(BaseModel):
    latitude: float
    longitude: float
    frp: float
    confidence: str
    acq_datetime: Optional[str] = None

class SourceAttributionInput(BaseModel):
    location: GeoPoint
    pm25: float
    pm10: float
    no2: Optional[float] = 25.0
    so2: Optional[float] = 12.0
    co: Optional[float] = 1.0
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: float
    boundary_layer_height: Optional[float] = 600.0
    hour_of_day: int
    nearby_fires: List[NearbyFireInput] = []
    is_industrial_zone: Optional[bool] = False
    is_highway_corridor: Optional[bool] = False

class EvidenceItem(BaseModel):
    metric: str
    value: str
    threshold_or_norm: str
    impact: str
    description: str

class SourceScores(BaseModel):
    traffic: float
    industrial: float
    biomass: float
    dust: float
    other: float

class SourceAttributionOutput(BaseModel):
    location: GeoPoint
    scores: SourceScores
    dominant_source: str
    confidence: float
    evidence: List[EvidenceItem]
    dispersion_factor: str

class HotspotStationPoint(BaseModel):
    station_id: str
    latitude: float
    longitude: float
    pm25: float
    pm10: float
    aqi: int

class SpatialHotspotInput(BaseModel):
    points: List[HotspotStationPoint]
    eps_km: Optional[float] = 15.0
    min_samples: Optional[int] = 2

class HotspotCluster(BaseModel):
    cluster_id: int
    centroid: GeoPoint
    radius_meters: float
    avg_pm25: float
    avg_pm10: float
    avg_aqi: int
    severity_level: str
    contributing_stations: int
    hull_coordinates: List[List[float]]

class SpatialHotspotOutput(BaseModel):
    clusters_count: int
    clusters: List[HotspotCluster]

class TimeSeriesHistoryPoint(BaseModel):
    timestamp: str
    pm25: float
    pm10: float
    temperature: float
    humidity: float
    wind_speed: float

class ForecastHistoryInput(BaseModel):
    history: List[TimeSeriesHistoryPoint]
    horizon_hours: Optional[int] = 24

class ForecastPointOutput(BaseModel):
    timestamp: str
    pm25: float
    pm10: float
    aqi: int
    category: str
    uncertainty_range: Dict[str, float]

class ForecastResultOutput(BaseModel):
    generated_at: str
    horizon_hours: int
    forecast: List[ForecastPointOutput]
