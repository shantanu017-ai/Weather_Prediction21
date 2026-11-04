import { Request, Response } from 'express';
import { dataService } from '../services/dataService';

export const getStations = async (req: Request, res: Response) => {
  try {
    const { city, state, active } = req.query;
    const stations = dataService.getStations({
      city: city as string,
      state: state as string,
      active: active !== undefined ? active === 'true' : undefined
    });
    return res.json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getStationById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const station = dataService.getStationById(id);
    if (!station) {
      return res.status(404).json({ success: false, error: `Station '${id}' not found` });
    }
    return res.json({ success: true, data: station });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getStationHistory = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const limit = parseInt(req.query.limit as string || '72', 10);
    const station = dataService.getStationById(id);
    if (!station) {
      return res.status(404).json({ success: false, error: `Station '${id}' not found` });
    }
    const history = dataService.getStationHistory(id, limit);
    return res.json({
      success: true,
      stationId: id,
      stationName: station.name,
      count: history.length,
      data: history
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
