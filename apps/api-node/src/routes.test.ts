import { describe, it } from 'node:test';
import assert from 'node:assert';
import app from './index';
import http from 'http';

function makeRequest(path: string, options: { method?: string; body?: any } = {}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const addr = server.address() as any;
      const port = addr.port;
      const postData = options.body ? JSON.stringify(options.body) : null;

      const req = http.request({
        host: 'localhost',
        port: port,
        path: path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  });
}

describe('Node.js API Gateway Integration Tests', () => {
  it('GET /api/v1/health should return service health', async () => {
    const res = await makeRequest('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  it('GET /api/v1/stations should return monitoring stations in Maharashtra', async () => {
    const res = await makeRequest('/api/v1/stations');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length >= 5);
    const kolhapur = res.body.data.find((s: any) => s.id === 'kolhapur-shivaji-uni');
    assert.ok(kolhapur);
    assert.strictEqual(kolhapur.city, 'Kolhapur');
  });

  it('GET /api/v1/stations/:id should return single station', async () => {
    const res = await makeRequest('/api/v1/stations/kolhapur-shivaji-uni');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Shivaji University, Vidyanagar');
  });

  it('GET /api/v1/stations/:id with non-existent ID should return 404', async () => {
    const res = await makeRequest('/api/v1/stations/non-existent-123');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/v1/stations/:id/history should return time-series measurements', async () => {
    const res = await makeRequest('/api/v1/stations/kolhapur-shivaji-uni/history?limit=12');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 12);
  });

  it('GET /api/v1/air-quality/current should return current AQI & sub-indices', async () => {
    const res = await makeRequest('/api/v1/air-quality/current?stationId=kolhapur-shivaji-uni');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.measurement);
    assert.ok(res.body.measurement.aqi > 0);
  });

  it('POST /api/v1/air-quality/predict should estimate PM2.5 and PM10', async () => {
    const res = await makeRequest('/api/v1/air-quality/predict', {
      method: 'POST',
      body: {
        latitude: 16.6775,
        longitude: 74.2541,
        aod_550nm: 0.65,
        temperature_2m: 28.0,
        relative_humidity_2m: 55.0,
        wind_speed_10m: 2.5,
        wind_direction_10m: 240.0,
        boundary_layer_height: 700.0,
        hour_of_day: 12
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.prediction.predicted_pm25 > 0);
    assert.ok(res.body.prediction.predicted_pm10 > res.body.prediction.predicted_pm25);
  });

  it('GET /api/v1/air-quality/attribution should return probabilistic source breakdown', async () => {
    const res = await makeRequest('/api/v1/air-quality/attribution?stationId=kolhapur-shiroli-midc');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.attribution);
    assert.ok(res.body.attribution.scores);
    assert.ok(res.body.attribution.evidence.length > 0);
  });

  it('GET /api/v1/air-quality/hotspots should return detected pollution clusters', async () => {
    const res = await makeRequest('/api/v1/air-quality/hotspots');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('GET /api/v1/air-quality/fires should return NASA FIRMS active hotspots', async () => {
    const res = await makeRequest('/api/v1/air-quality/fires');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length > 0);
  });

  it('GET /api/v1/air-quality/forecast should return 24-hour predictive trend', async () => {
    const res = await makeRequest('/api/v1/air-quality/forecast?stationId=kolhapur-shivaji-uni');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.forecast);
    assert.strictEqual(res.body.forecast.horizonHours, 24);
  });

  it('GET /api/v1/admin/system-status should return service freshness metrics', async () => {
    const res = await makeRequest('/api/v1/admin/system-status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.services.length >= 3);
  });
});
