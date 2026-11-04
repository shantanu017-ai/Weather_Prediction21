import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.schemas.ml_schemas import (
    ConcentrationFeaturesInput,
    ConcentrationPredictionOutput,
    MultiPollutantInput,
    AQIResultOutput,
    SourceAttributionInput,
    SourceAttributionOutput,
    SpatialHotspotInput,
    SpatialHotspotOutput,
    ForecastHistoryInput,
    ForecastResultOutput
)
from app.core.cpcb_engine import evaluate_cpcb_aqi
from app.services.source_attribution import evaluate_probabilistic_attribution
from app.services.hotspot_detector import detect_spatial_hotspots
from app.models.regressor import ConcentrationEstimator, TimeSeriesForecaster

app = FastAPI(
    title="GP-01 Air Quality Intelligence ML Service",
    description="FastAPI service for Air Quality Prediction, Indian CPCB AQI Calculation, Source Attribution, and Hotspot Detection.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

estimator = ConcentrationEstimator()
forecaster = TimeSeriesForecaster()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GP-01 Air Quality ML Engine",
        "version": "1.0.0",
        "models": {
            "pm25_estimator": estimator.pm25_model is not None,
            "pm10_estimator": estimator.pm10_model is not None,
            "cpcb_aqi_engine": "ACTIVE",
            "source_attribution_engine": "ACTIVE",
            "spatial_hotspot_engine": "ACTIVE",
            "forecaster_engine": "ACTIVE"
        }
    }

@app.post("/ml/v1/predict/concentrations", response_model=ConcentrationPredictionOutput)
def predict_concentrations(features: ConcentrationFeaturesInput):
    try:
        return estimator.predict(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/ml/v1/calculate/aqi", response_model=AQIResultOutput)
def calculate_aqi(pollutants: MultiPollutantInput):
    try:
        res = evaluate_cpcb_aqi(pollutants.model_dump())
        return AQIResultOutput(
            aqi=res["aqi"],
            category=res["category"],
            dominant_pollutant=res["dominant_pollutant"],
            sub_indices=res["sub_indices"],
            is_valid=res["is_valid"],
            status_note=res["status_note"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AQI calculation error: {str(e)}")

@app.post("/ml/v1/attribution/analyze", response_model=SourceAttributionOutput)
def analyze_source_attribution(input_data: SourceAttributionInput):
    try:
        return evaluate_probabilistic_attribution(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attribution error: {str(e)}")

@app.post("/ml/v1/spatial/hotspots", response_model=SpatialHotspotOutput)
def extract_hotspots(spatial_input: SpatialHotspotInput):
    try:
        return detect_spatial_hotspots(spatial_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hotspot detection error: {str(e)}")

@app.post("/ml/v1/forecast/timeseries", response_model=ForecastResultOutput)
def get_timeseries_forecast(history_input: ForecastHistoryInput):
    try:
        return forecaster.forecast(history_input)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
