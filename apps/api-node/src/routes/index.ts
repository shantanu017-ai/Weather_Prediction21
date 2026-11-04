import { Router } from 'express';
import {
  getStations,
  getStationById,
  getStationHistory
} from '../controllers/stationsController';
import {
  getCurrentAirQuality,
  predictAirQuality,
  getSourceAttribution,
  getPollutionHotspots,
  getFires,
  getWeather,
  getForecast
} from '../controllers/airQualityController';
import { getSystemStatus } from '../controllers/adminController';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GP-01 Air Quality Node Gateway API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Stations
router.get('/stations', getStations);
router.get('/stations/:id', getStationById);
router.get('/stations/:id/history', getStationHistory);

// Air Quality & Satellite / Weather Fusions
router.get('/air-quality/current', getCurrentAirQuality);
router.post('/air-quality/predict', predictAirQuality);
router.get('/air-quality/attribution', getSourceAttribution);
router.get('/air-quality/hotspots', getPollutionHotspots);
router.get('/air-quality/fires', getFires);
router.get('/air-quality/weather', getWeather);
router.get('/air-quality/forecast', getForecast);

// Admin & Diagnostics
router.get('/admin/system-status', getSystemStatus);

export default router;
