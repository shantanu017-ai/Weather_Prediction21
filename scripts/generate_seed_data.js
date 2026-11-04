const fs = require('fs');
const path = require('path');

const stations = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/sample_kolhapur/stations.json'), 'utf8'));

// CPCB breakpoints for reference
function calcSubIndex(val, ranges) {
  if (val == null || isNaN(val) || val < 0) return null;
  for (const r of ranges) {
    if (val >= r.bLow && val <= r.bHigh) {
      return Math.round(r.iLow + ((r.iHigh - r.iLow) / (r.bHigh - r.bLow)) * (val - r.bLow));
    }
  }
  return 500;
}

const pm25Ranges = [
  { bLow: 0, bHigh: 30, iLow: 0, iHigh: 50 },
  { bLow: 31, bHigh: 60, iLow: 51, iHigh: 100 },
  { bLow: 61, bHigh: 90, iLow: 101, iHigh: 200 },
  { bLow: 91, bHigh: 120, iLow: 201, iHigh: 300 },
  { bLow: 121, bHigh: 250, iLow: 301, iHigh: 400 },
  { bLow: 251, bHigh: 500, iLow: 401, iHigh: 500 }
];

const pm10Ranges = [
  { bLow: 0, bHigh: 50, iLow: 0, iHigh: 50 },
  { bLow: 51, bHigh: 100, iLow: 51, iHigh: 100 },
  { bLow: 101, bHigh: 250, iLow: 101, iHigh: 200 },
  { bLow: 251, bHigh: 350, iLow: 201, iHigh: 300 },
  { bLow: 351, bHigh: 430, iLow: 301, iHigh: 400 },
  { bLow: 431, bHigh: 600, iLow: 401, iHigh: 500 }
];

const no2Ranges = [
  { bLow: 0, bHigh: 40, iLow: 0, iHigh: 50 },
  { bLow: 41, bHigh: 80, iLow: 51, iHigh: 100 },
  { bLow: 81, bHigh: 180, iLow: 101, iHigh: 200 },
  { bLow: 181, bHigh: 280, iLow: 201, iHigh: 300 },
  { bLow: 281, bHigh: 400, iLow: 301, iHigh: 400 },
  { bLow: 401, bHigh: 800, iLow: 401, iHigh: 500 }
];

function getCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

const measurements = [];
const weatherRecords = [];

// Generate past 7 days of hourly records up to now
const now = new Date('2026-11-04T12:00:00Z');
const hoursCount = 24 * 7; // 168 hours

stations.forEach(station => {
  const isIndustrial = station.id.includes('midc');
  const isTraffic = station.id.includes('nh48') || station.id.includes('bkc') || station.id.includes('karve');
  const isResidential = station.id.includes('kasaba') || station.id.includes('shivaji');

  for (let h = hoursCount; h >= 0; h--) {
    const timestamp = new Date(now.getTime() - h * 3600 * 1000);
    const hour = timestamp.getUTCHours(); // 0 to 23
    const localHour = (hour + 5.5) % 24;  // IST

    // Traffic peak (8-10 AM, 6-9 PM)
    const trafficFactor = (Math.exp(-Math.pow((localHour - 9) / 2, 2)) + Math.exp(-Math.pow((localHour - 19) / 2.5, 2))) * 1.5;
    // Industrial night-time inversion factor (cooler, lower boundary layer)
    const nightInversion = (localHour >= 22 || localHour <= 6) ? 1.35 : 0.9;
    
    // Base pollutant concentrations according to station environment
    let basePM25 = 45;
    let basePM10 = 85;
    let baseNO2 = 30;
    let baseSO2 = 15;
    let baseCO = 1.2;
    let baseO3 = 35;

    if (isIndustrial) {
      basePM25 = 75 * nightInversion;
      basePM10 = 150 * nightInversion;
      baseSO2 = 48 * nightInversion;
      baseNO2 = 55;
      baseCO = 2.1;
    } else if (isTraffic) {
      basePM25 = 65 + trafficFactor * 30;
      basePM10 = 130 + trafficFactor * 45;
      baseNO2 = 50 + trafficFactor * 40;
      baseCO = 1.5 + trafficFactor * 1.8;
      baseSO2 = 18;
    } else if (isResidential) {
      basePM25 = 35 + trafficFactor * 10;
      basePM10 = 65 + trafficFactor * 15;
      baseNO2 = 25 + trafficFactor * 12;
      baseSO2 = 10;
    }

    // Add mild natural variance
    const noise = () => (Math.random() - 0.5) * 6;
    const pm25 = Math.max(12, Math.round((basePM25 + noise()) * 10) / 10);
    const pm10 = Math.max(25, Math.round((basePM10 + noise() * 1.5) * 10) / 10);
    const no2 = Math.max(8, Math.round((baseNO2 + noise()) * 10) / 10);
    const so2 = Math.max(4, Math.round((baseSO2 + noise() * 0.5) * 10) / 10);
    const co = Math.max(0.2, Math.round((baseCO + (Math.random() - 0.5) * 0.2) * 100) / 100);
    const o3 = Math.max(10, Math.round((baseO3 + (localHour >= 12 && localHour <= 16 ? 25 : 0) + noise()) * 10) / 10);

    const subPm25 = calcSubIndex(pm25, pm25Ranges);
    const subPm10 = calcSubIndex(pm10, pm10Ranges);
    const subNo2 = calcSubIndex(no2, no2Ranges);

    let maxAqi = Math.max(subPm25 || 0, subPm10 || 0, subNo2 || 0);
    let dominant = 'PM2.5';
    if ((subPm10 || 0) > (subPm25 || 0) && (subPm10 || 0) > (subNo2 || 0)) dominant = 'PM10';
    if ((subNo2 || 0) > (subPm25 || 0) && (subNo2 || 0) > (subPm10 || 0)) dominant = 'NO2';

    measurements.push({
      stationId: station.id,
      recordedAt: timestamp.toISOString(),
      pm25,
      pm10,
      no2,
      so2,
      co,
      o3,
      aqi: maxAqi,
      aqiCategory: getCategory(maxAqi),
      dominantPollutant: dominant,
      sourceTag: 'CPCB_CAAQMS_SYNCHRONIZED'
    });

    // Generate weather sample
    if (h % 3 === 0) { // every 3 hours per station
      const temp = Math.round((28 + Math.sin((localHour - 9) * Math.PI / 12) * 6 + (Math.random() - 0.5)) * 10) / 10;
      const humidity = Math.round(Math.max(30, Math.min(95, 65 - Math.sin((localHour - 9) * Math.PI / 12) * 20)));
      const windSpeed = Math.round((2.5 + Math.random() * 2.2) * 10) / 10;
      const windDir = Math.round(230 + (Math.random() - 0.5) * 40); // South-westerly/westerly
      const pbl = Math.round(350 + Math.max(0, Math.sin((localHour - 6) * Math.PI / 12)) * 900); // 350m at night up to 1250m daytime

      weatherRecords.push({
        latitude: station.location.latitude,
        longitude: station.location.longitude,
        recordedAt: timestamp.toISOString(),
        temperature2m: temp,
        relativeHumidity2m: humidity,
        windSpeed10m: windSpeed,
        windDirection10m: windDir,
        surfacePressure: 1012.5,
        precipitation: 0.0,
        boundaryLayerHeight: pbl,
        source: 'Open-Meteo-ERA5'
      });
    }
  }
});

// Generate active fire hotspots in Kolhapur / Western Maharashtra / Karnataka border region
const fires = [
  {
    id: "firm-kop-001",
    latitude: 16.6120,
    longitude: 74.3450,
    acqDatetime: "2026-11-04T07:30:00Z",
    frp: 28.4,
    confidence: "high",
    satellite: "VIIRS_SNPP",
    daynight: "D"
  },
  {
    id: "firm-kop-002",
    latitude: 16.7820,
    longitude: 74.3850,
    acqDatetime: "2026-11-04T07:32:00Z",
    frp: 19.8,
    confidence: "nominal",
    satellite: "VIIRS_SNPP",
    daynight: "D"
  },
  {
    id: "firm-mh-003",
    latitude: 16.9200,
    longitude: 74.4500,
    acqDatetime: "2026-11-04T02:15:00Z",
    frp: 34.2,
    confidence: "high",
    satellite: "MODIS_Aqua",
    daynight: "N"
  },
  {
    id: "firm-mh-004",
    latitude: 17.1500,
    longitude: 74.2100,
    acqDatetime: "2026-11-03T18:40:00Z",
    frp: 14.5,
    confidence: "nominal",
    satellite: "VIIRS_SNPP",
    daynight: "N"
  },
  {
    id: "firm-pun-005",
    latitude: 18.3200,
    longitude: 74.0500,
    acqDatetime: "2026-11-04T08:10:00Z",
    frp: 22.1,
    confidence: "nominal",
    satellite: "VIIRS_SNPP",
    daynight: "D"
  }
];

fs.writeFileSync(path.join(__dirname, '../data/sample_kolhapur/measurements.json'), JSON.stringify(measurements, null, 2));
fs.writeFileSync(path.join(__dirname, '../data/sample_kolhapur/weather.json'), JSON.stringify(weatherRecords, null, 2));
fs.writeFileSync(path.join(__dirname, '../data/sample_kolhapur/fires.json'), JSON.stringify(fires, null, 2));

console.log(`Generated ${measurements.length} measurements, ${weatherRecords.length} weather points, and ${fires.length} fire hotspots.`);
