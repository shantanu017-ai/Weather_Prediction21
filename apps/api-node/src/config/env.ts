import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to local

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000/ml/v1',
  databaseUrl: process.env.DATABASE_URL || '',
  openaqApiKey: process.env.OPENAQ_API_KEY || '',
  nasaFirmsMapKey: process.env.NASA_FIRMS_MAP_KEY || '',
  openMeteoBaseUrl: process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1',
  dataDir: path.resolve(__dirname, '../../../../data/sample_kolhapur')
};
