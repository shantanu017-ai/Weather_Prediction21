import { Request, Response } from 'express';
import { dataService } from '../services/dataService';
import { config } from '../config/env';

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const freshness = dataService.getFreshnessStatus();
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      services: freshness,
      configuration: {
        port: config.port,
        mlServiceUrl: config.mlServiceUrl,
        hasDatabaseUrl: Boolean(config.databaseUrl),
        hasOpenAqKey: Boolean(config.openaqApiKey),
        hasNasaFirmsKey: Boolean(config.nasaFirmsMapKey)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
