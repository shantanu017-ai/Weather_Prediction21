# GP-01: Air Quality Monitoring & Source Attribution Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![LightGBM](https://img.shields.io/badge/LightGBM-4.7-brightgreen)](https://lightgbm.readthedocs.io/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostGIS-16-blue?logo=postgresql)](https://postgis.net/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, full-stack AI/ML geospatial environmental intelligence platform that fuses ground monitoring sensor measurements, satellite atmospheric observations, and meteorological models to estimate air quality, detect pollution hotspots, and calculate probabilistic pollution source attributions.

Initial high-resolution demonstration focus: **Maharashtra State, India (Kolhapur District Focus)**.

---

## 1. System Architecture

The platform separates concerns across a modern web presentation tier, an orchestration API gateway, and a specialized machine learning inference service:

```
+-----------------------------------------------------------------------------------+
|                            PRESENTATION TIER (Next.js)                            |
|    - Dashboard (NAQI Gauge, Pollutants Grid, Satellite/Weather Fusion)            |
|    - Geospatial Explorer (Leaflet Dark Matter, FIRMS Fires, Hotspots)             |
|    - Source Attribution Workbench (Probabilistic Breakdown & Evidence)           |
|    - 24h Predictive Forecaster (Recharts Uncertainty Bounds)                      |
|    - System Telemetry & Model Performance Matrix                                  |
+-----------------------------------------------------------------------------------+
                                        |  REST / JSON
                                        v
+-----------------------------------------------------------------------------------+
|                        APPLICATION GATEWAY (Node.js / Express)                    |
|    - REST API Endpoints (/api/v1/...)                                             |
|    - Indian CPCB NAQI Sub-Index Calculation Engine                                |
|    - Multi-Source Cache & Synchronization (OpenAQ, NASA FIRMS, Open-Meteo)        |
|    - PostGIS Spatial Database Connector & Climatological Fallbacks                |
+-----------------------------------------------------------------------------------+
                                        |  REST / JSON
                                        v
+-----------------------------------------------------------------------------------+
|                        AI/ML ENGINE (Python 3.10 / FastAPI)                       |
|    - Model 1: LightGBM PM2.5 & PM10 Regressors (R² = 0.988 / 0.990)               |
|    - Model 2: CPCB 6-Category AQI Classifier Engine                               |
|    - Model 3: Multi-Criteria Probabilistic Source Attribution Engine              |
|    - Model 4: Geospatial DBSCAN Spatial Hotspot Clustering (Haversine Metric)     |
|    - Model 5: Autoregressive 24h Time-Series Forecaster                           |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Machine Learning & Methodology

### Model 1: PM2.5 & PM10 Concentration Regressor
- **Algorithm**: LightGBM Gradient Boosted Decision Trees (`LGBMRegressor`).
- **Feature Fusion**: Satellite Aerosol Optical Depth (AOD 550nm), Sentinel-5P tropospheric column NO2, surface temperature, relative humidity, wind speed, wind direction, surface pressure, boundary layer height, cloud fraction, station latitude/longitude, and temporal diurnal cyclical encodings ($\sin/\cos$ of hour).
- **Validation**: 5-Fold Chronological Time-Series Split (Zero lookahead data leakage).
  - **PM2.5 Regressor**: $\text{MAE} = 1.83 \text{ \mu g/m}^3, \text{RMSE} = 2.36, R^2 = 0.988$
  - **PM10 Regressor**: $\text{MAE} = 3.03 \text{ \mu g/m}^3, \text{RMSE} = 4.35, R^2 = 0.990$
- **Artifacts**: Serialized using Joblib in [`apps/ml-service/trained_artifacts/`](file:///s:/Diwali_hack/apps/ml-service/trained_artifacts).

### Model 2: Indian CPCB AQI Engine
Adheres to the official **Central Pollution Control Board (CPCB)** NAQI sub-index formula:

$$I_p = I_{low} + \frac{I_{high} - I_{low}}{B_{high} - B_{low}} \times (C_p - B_{low})$$

Where overall AQI is the maximum sub-index among monitored pollutants:

$$AQI = \max(I_{PM2.5}, I_{PM10}, I_{NO2}, I_{SO2}, I_{CO}, I_{O3})$$

| Category | AQI Range | PM2.5 (24h) | PM10 (24h) | NO2 (24h) | SO2 (24h) | CO (8h, mg/m³) | O3 (8h) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Good** | 0 – 50 | 0 – 30 | 0 – 50 | 0 – 40 | 0 – 40 | 0 – 1.0 | 0 – 50 |
| **Satisfactory** | 51 – 100 | 31 – 60 | 51 – 100 | 41 – 80 | 41 – 80 | 1.1 – 2.0 | 51 – 100 |
| **Moderate** | 101 – 200 | 61 – 90 | 101 – 250 | 81 – 180 | 81 – 380 | 2.1 – 10.0 | 101 – 168 |
| **Poor** | 201 – 300 | 91 – 120 | 251 – 350 | 181 – 280 | 381 – 800 | 10.1 – 17.0 | 169 – 208 |
| **Very Poor** | 301 – 400 | 121 – 250 | 351 – 430 | 281 – 400 | 801 – 1600 | 17.1 – 34.0 | 209 – 748 |
| **Severe** | 401 – 500 | 250+ | 430+ | 400+ | 1600+ | 34.0+ | 748+ |

### Model 3: Probabilistic Pollution Source Attribution Engine
To ensure scientific credibility and prevent unsupported claims, source attribution is structured as a probabilistic Bayesian weighting engine:
1. **Vehicular Traffic**: High $NO_2$, diurnal rush hour peaks (08:00–11:00 and 17:00–21:00 IST), and proximity to NH-48 transit freight arterial.
2. **Industrial Emissions**: Elevated $SO_2$ ($> 25 \text{ \mu g/m}^3$), steady continuous emissions profile, and MIDC industrial cluster proximity (Shiroli MIDC / Gokul Shirgaon).
3. **Crop Residue & Biomass Burning**: Elevated $CO$ combined with active NASA FIRMS thermal anomalies detected upwind within 120 km ($\Delta\theta_{wind} \le 45^\circ$).
4. **Road & Construction Dust**: Coarse particle dominance ($PM10/PM2.5 > 1.9$), low relative humidity ($< 40\%$), and wind speeds $> 3.0 \text{ m/s}$.
5. **Atmospheric Stagnation**: Shallow planetary boundary layer ($PBL < 350 \text{ m}$) and calm wind ($< 1.5 \text{ m/s}$).

### Model 4: Geospatial Hotspot Detection
- Algorithm: **DBSCAN (Density-Based Spatial Clustering of Applications with Noise)** using Haversine geographic distance.
- Computes convex hulls and severity classifications for high-AQI clusters across regional stations.

### Model 5: 24h Air Quality Forecaster
- Autoregressive feature-engineered gradient boosting forecasting 24 hours ahead with upper and lower 95% confidence intervals.

---

## 3. Demonstration Region: Maharashtra & Kolhapur

The system includes pre-synchronized continuous observations across:
- **Shivaji University, Kolhapur** (`MH_KOP_001`): Baseline urban educational background.
- **Kasaba Bawada Urban Station, Kolhapur** (`MH_KOP_002`): Dense residential / lake basin.
- **Shiroli MIDC Industrial Area, Kolhapur** (`MH_KOP_003`): Foundry, metallurgy & boiler cluster.
- **Gokul Shirgaon Industrial Zone, Kolhapur** (`MH_KOP_004`): Mixed manufacturing & sugar industry.
- **NH-48 Shiroli Bypass Transit Corridor, Kolhapur** (`MH_KOP_005`): High-density freight transit.
- **Regional Maharashtra Context**: Pune (Karve Rd), Mumbai (BKC), Solapur (MIDC), Sangli (Civil Hospital).

---

## 4. Repository Structure

```text
s:\Diwali_hack\
├── apps\
│   ├── web\                          # Next.js 14 App Router, React 18, Tailwind CSS, Leaflet
│   ├── api-node\                     # Node.js + Express + TypeScript Gateway Backend
│   └── ml-service\                   # Python 3.10 + FastAPI ML Engine (LightGBM, Joblib)
├── packages\
│   └── shared\                       # TypeScript CPCB AQI constants & shared data contracts
├── data\
│   └── sample_kolhapur\              # Ground truth stations, 1,521 hourly records, FIRMS fires
├── docker-compose.yml                # Development multi-container orchestration
├── docker-compose.prod.yml           # Production container orchestration
├── render.yaml                       # Render Cloud deployment blueprint
├── .env.example                      # Centralized environment template
└── README.md
```

---

## 5. Local Setup & Quickstart Guide

### Prerequisites
- Node.js v18+ or v22+
- Python 3.10+
- npm v9+

### Step 1: Install Dependencies & Build Shared Core
```bash
# In packages/shared:
cd packages/shared
npm install
npm run build
```

### Step 2: Set Up Python ML Service
```bash
# In apps/ml-service:
cd apps/ml-service
py -3.10 -m venv venv
venv\Scripts\pip install -r requirements.txt

# Run model training & cross-validation:
venv\Scripts\python training/train_models.py

# Start ML FastAPI server:
venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
ML API will be live at: `http://localhost:8000/docs`

### Step 3: Set Up Node.js API Gateway
```bash
# In apps/api-node:
cd apps/api-node
npm install
npm run build

# Start Node API Gateway:
npm run dev
```
API Gateway will be live at: `http://localhost:5000/api/v1`

### Step 4: Set Up Next.js Frontend Dashboard
```bash
# In apps/web:
cd apps/web
npm install
npm run dev
```
Dashboard will be accessible at: `http://localhost:3000`

---

## 6. REST API Reference

### Application Gateway Endpoints (`/api/v1/...`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health heartbeat and connectivity |
| `GET` | `/stations` | List monitoring stations with latest AQI |
| `GET` | `/stations/:id` | Specific station details and coordinates |
| `GET` | `/stations/:id/history` | Historical time-series measurements (`limit=48`) |
| `GET` | `/air-quality/current` | Current AQI, dominant pollutant, and sub-indices |
| `POST` | `/air-quality/predict` | Predict PM2.5/PM10 from satellite AOD and meteorology |
| `GET` | `/air-quality/attribution` | Probabilistic source attribution and evidence |
| `GET` | `/air-quality/hotspots` | Clustered pollution hotspots via DBSCAN |
| `GET` | `/air-quality/fires` | Active NASA FIRMS fire anomalies |
| `GET` | `/air-quality/weather` | Current atmospheric conditions and wind vectors |
| `GET` | `/air-quality/forecast` | 24-hour predictive air quality horizon |
| `GET` | `/admin/system-status` | Service freshness and ingestion telemetry |

---

## 7. Production Deployment Guide

### A. Frontend (Vercel)
1. Push repository to GitHub.
2. In Vercel, import project with root directory set to `apps/web`.
3. Set environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render API URL (e.g. `https://gp01-api-gateway.onrender.com/api/v1`).
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk production publishable key.
4. Deploy!

### B. Backend Services (Render Blueprint)
1. Connect your GitHub repository to Render.
2. Select **Blueprints** and choose [`render.yaml`](file:///s:/Diwali_hack/render.yaml).
3. Render will automatically provision:
   - `gp01-postgis-db`: Managed PostgreSQL database with PostGIS.
   - `gp01-ml-service`: Python FastAPI ML service running LightGBM models.
   - `gp01-api-gateway`: Node.js Express Gateway connecting web clients to ML and Database.

### C. Containerized Deployment (Docker Compose)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 8. Rollback & Safety Policy
- In accordance with safety guidelines, never deploy directly to production without testing on a staging environment.
- In case of deployment issues:
  1. Frontend: Revert to previous successful deployment commit in Vercel dashboard.
  2. Gateway & ML: Roll back to previous release tag in Render dashboard or run `docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d`.

---

## 9. License & Citations
- **CPCB**: Central Pollution Control Board, Ministry of Environment, Forest and Climate Change, Govt. of India.
- **NASA FIRMS**: Fire Information for Resource Management System, NASA Earth Science Data.
- **Copernicus**: Sentinel-5P TROPOMI & CAMS Atmospheric Monitoring Service.
- **Open-Meteo**: Weather and atmospheric reanalysis models.
- **License**: MIT
