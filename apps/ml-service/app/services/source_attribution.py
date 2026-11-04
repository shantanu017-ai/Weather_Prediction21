import math
from typing import List, Dict, Any, Tuple
from ..schemas.ml_schemas import SourceAttributionInput, SourceAttributionOutput, SourceScores, EvidenceItem, GeoPoint

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Bearing from (lat1, lon1) towards (lat2, lon2)
    lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
    lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)
    dlon = lon2_r - lon1_r
    y = math.sin(dlon) * math.cos(lat2_r)
    x = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlon)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360) % 360

def evaluate_probabilistic_attribution(input_data: SourceAttributionInput) -> SourceAttributionOutput:
    evidence: List[EvidenceItem] = []
    
    # Raw points calculation
    raw_traffic = 20.0
    raw_industrial = 15.0
    raw_biomass = 10.0
    raw_dust = 15.0
    raw_other = 15.0

    pm25 = input_data.pm25
    pm10 = max(input_data.pm10, pm25)
    ratio_fine_coarse = pm25 / pm10 if pm10 > 0 else 0.5
    ratio_coarse_fine = pm10 / pm25 if pm25 > 0 else 1.0
    no2 = input_data.no2 or 20.0
    so2 = input_data.so2 or 10.0
    co = input_data.co or 1.0

    # 1. Traffic Diagnostics
    # Morning rush (8-11) or evening rush (17-21)
    is_rush_hour = (8 <= input_data.hour_of_day <= 11) or (17 <= input_data.hour_of_day <= 21)
    if is_rush_hour:
        raw_traffic += 25.0
        evidence.append(EvidenceItem(
            metric="Diurnal Rush Hour",
            value=f"{input_data.hour_of_day}:00 IST",
            threshold_or_norm="Peak transit window",
            impact="High",
            description="Measurement falls directly within metropolitan commuter rush hours."
        ))

    if no2 > 40.0:
        boost = min(30.0, (no2 - 40.0) * 0.75)
        raw_traffic += boost
        raw_industrial += boost * 0.4
        evidence.append(EvidenceItem(
            metric="Nitrogen Dioxide (NO2)",
            value=f"{no2:.1f} µg/m³",
            threshold_or_norm="> 40 µg/m³ CPCB baseline",
            impact="High" if no2 > 70 else "Moderate",
            description="Elevated NO2 indicates significant high-temperature fossil fuel combustion."
        ))

    if input_data.is_highway_corridor:
        raw_traffic += 30.0
        evidence.append(EvidenceItem(
            metric="Highway Corridor Proximity",
            value="Adjacent (NH-48 corridor)",
            threshold_or_norm="Near transit arterial",
            impact="High",
            description="Station location is situated along major multi-axle freight transit corridor."
        ))

    # 2. Industrial Diagnostics
    if so2 > 25.0:
        boost = min(40.0, (so2 - 25.0) * 1.2)
        raw_industrial += boost
        evidence.append(EvidenceItem(
            metric="Sulfur Dioxide (SO2)",
            value=f"{so2:.1f} µg/m³",
            threshold_or_norm="> 25 µg/m³",
            impact="High",
            description="Pronounced SO2 emissions typically originate from industrial boilers, smelters, and foundries."
        ))

    if input_data.is_industrial_zone:
        raw_industrial += 35.0
        evidence.append(EvidenceItem(
            metric="Industrial Zone Proximity",
            value="Designated MIDC Zone",
            threshold_or_norm="MIDC Cluster",
            impact="High",
            description="Located within or immediately downwind of established MIDC industrial manufacturing belt."
        ))

    # 3. Biomass & Crop Residue Burning Diagnostics
    # Check NASA FIRMS upwind fires
    upwind_fires_count = 0
    max_frp = 0.0
    closest_fire_dist = 999.0

    st_lat = input_data.location.latitude
    st_lon = input_data.location.longitude
    wind_dir = input_data.wind_direction # Direction wind is blowing from (meteorological degrees)

    for fire in input_data.nearby_fires:
        dist_km = haversine_distance_km(st_lat, st_lon, fire.latitude, fire.longitude)
        if dist_km <= 120.0:
            # Bearing from station towards the fire:
            bearing_to_fire = calculate_bearing_deg(st_lat, st_lon, fire.latitude, fire.longitude)
            # Wind direction is where wind comes from; if wind_dir aligns with bearing_to_fire, fire is upwind
            angle_diff = abs((wind_dir - bearing_to_fire + 180) % 360 - 180)
            if angle_diff <= 45.0: # Fire is roughly upwind
                upwind_fires_count += 1
                if fire.frp > max_frp:
                    max_frp = fire.frp
                if dist_km < closest_fire_dist:
                    closest_fire_dist = dist_km

    if upwind_fires_count > 0:
        fire_boost = min(50.0, 15.0 * upwind_fires_count + max_frp * 0.5)
        raw_biomass += fire_boost
        evidence.append(EvidenceItem(
            metric="NASA FIRMS Upwind Fire Detection",
            value=f"{upwind_fires_count} active thermal anomalies",
            threshold_or_norm=f"Closest: {closest_fire_dist:.1f} km (Max FRP: {max_frp:.1f} MW)",
            impact="High",
            description="Active satellite fire hotspots detected upwind along current atmospheric drift trajectory."
        ))

    if co > 1.8:
        raw_biomass += min(30.0, (co - 1.8) * 12.0)
        evidence.append(EvidenceItem(
            metric="Carbon Monoxide (CO)",
            value=f"{co:.2f} mg/m³",
            threshold_or_norm="> 1.8 mg/m³",
            impact="Moderate",
            description="Elevated CO indicates incomplete smoldering combustion characteristic of biomass and stubble."
        ))

    # 4. Construction & Road Dust Diagnostics
    if ratio_coarse_fine > 1.9:
        boost = min(35.0, (ratio_coarse_fine - 1.9) * 20.0)
        raw_dust += boost
        evidence.append(EvidenceItem(
            metric="PM10 / PM2.5 Ratio",
            value=f"{ratio_coarse_fine:.2f}",
            threshold_or_norm="> 1.9 coarse particle dominance",
            impact="High",
            description="High coarse particle ratio indicates mechanical resuspension of crustal road dust and construction debris."
        ))

    if input_data.humidity < 40.0 and input_data.wind_speed > 3.0:
        raw_dust += 20.0
        evidence.append(EvidenceItem(
            metric="Dry Resuspension Meteorology",
            value=f"Humidity: {input_data.humidity:.0f}%, Wind: {input_data.wind_speed:.1f} m/s",
            threshold_or_norm="RH < 40%, Wind > 3.0 m/s",
            impact="Moderate",
            description="Arid surface moisture combined with moderate wind speed promotes surface particulate lofting."
        ))

    # 5. Dispersion & Stagnation Context
    pbl = input_data.boundary_layer_height or 600.0
    dispersion_factor = "Moderate"
    if pbl < 350.0 and input_data.wind_speed < 1.5:
        raw_other += 30.0
        dispersion_factor = "Poor (Atmospheric Inversion / Stagnation)"
        evidence.append(EvidenceItem(
            metric="Boundary Layer Inversion",
            value=f"PBL: {pbl:.0f} m, Wind: {input_data.wind_speed:.1f} m/s",
            threshold_or_norm="PBL < 350 m, Wind < 1.5 m/s",
            impact="High",
            description="Shallow thermal inversion caps pollutant dispersion, trapping localized emissions near ground."
        ))
    elif pbl > 1000.0 and input_data.wind_speed > 4.0:
        dispersion_factor = "Good (Active Atmospheric Ventilation)"

    # Softmax / Normalization to 100%
    total_raw = raw_traffic + raw_industrial + raw_biomass + raw_dust + raw_other
    scores = SourceScores(
        traffic=round((raw_traffic / total_raw) * 100, 1),
        industrial=round((raw_industrial / total_raw) * 100, 1),
        biomass=round((raw_biomass / total_raw) * 100, 1),
        dust=round((raw_dust / total_raw) * 100, 1),
        other=round((raw_other / total_raw) * 100, 1)
    )

    # Determine dominant source
    score_dict = {
        "Vehicular Traffic": scores.traffic,
        "Industrial Emissions": scores.industrial,
        "Crop Residue & Biomass Burning": scores.biomass,
        "Road & Construction Dust": scores.dust,
        "Other / Background Stagnation": scores.other
    }
    dominant_source = max(score_dict, key=score_dict.get)
    max_val = score_dict[dominant_source]

    # Confidence calculation: based on margin above second highest + evidence count
    sorted_scores = sorted(score_dict.values(), reverse=True)
    margin = sorted_scores[0] - sorted_scores[1]
    confidence = min(95.0, max(52.0, 50.0 + margin * 1.2 + len(evidence) * 3.5))

    return SourceAttributionOutput(
        location=input_data.location,
        scores=scores,
        dominant_source=dominant_source,
        confidence=round(confidence, 1),
        evidence=evidence,
        dispersion_factor=dispersion_factor
    )
