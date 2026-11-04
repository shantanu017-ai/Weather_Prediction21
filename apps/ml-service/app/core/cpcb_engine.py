from typing import Dict, Optional, Tuple, Any

CPCB_BREAKPOINTS = {
    'pm25': [
        {'b_low': 0, 'b_high': 30, 'i_low': 0, 'i_high': 50},
        {'b_low': 31, 'b_high': 60, 'i_low': 51, 'i_high': 100},
        {'b_low': 61, 'b_high': 90, 'i_low': 101, 'i_high': 200},
        {'b_low': 91, 'b_high': 120, 'i_low': 201, 'i_high': 300},
        {'b_low': 121, 'b_high': 250, 'i_low': 301, 'i_high': 400},
        {'b_low': 251, 'b_high': 500, 'i_low': 401, 'i_high': 500},
    ],
    'pm10': [
        {'b_low': 0, 'b_high': 50, 'i_low': 0, 'i_high': 50},
        {'b_low': 51, 'b_high': 100, 'i_low': 51, 'i_high': 100},
        {'b_low': 101, 'b_high': 250, 'i_low': 101, 'i_high': 200},
        {'b_low': 251, 'b_high': 350, 'i_low': 201, 'i_high': 300},
        {'b_low': 351, 'b_high': 430, 'i_low': 301, 'i_high': 400},
        {'b_low': 431, 'b_high': 600, 'i_low': 401, 'i_high': 500},
    ],
    'no2': [
        {'b_low': 0, 'b_high': 40, 'i_low': 0, 'i_high': 50},
        {'b_low': 41, 'b_high': 80, 'i_low': 51, 'i_high': 100},
        {'b_low': 81, 'b_high': 180, 'i_low': 101, 'i_high': 200},
        {'b_low': 181, 'b_high': 280, 'i_low': 201, 'i_high': 300},
        {'b_low': 281, 'b_high': 400, 'i_low': 301, 'i_high': 400},
        {'b_low': 401, 'b_high': 800, 'i_low': 401, 'i_high': 500},
    ],
    'so2': [
        {'b_low': 0, 'b_high': 40, 'i_low': 0, 'i_high': 50},
        {'b_low': 41, 'b_high': 80, 'i_low': 51, 'i_high': 100},
        {'b_low': 81, 'b_high': 380, 'i_low': 101, 'i_high': 200},
        {'b_low': 381, 'b_high': 800, 'i_low': 201, 'i_high': 300},
        {'b_low': 801, 'b_high': 1600, 'i_low': 301, 'i_high': 400},
        {'b_low': 1601, 'b_high': 2400, 'i_low': 401, 'i_high': 500},
    ],
    'co': [
        {'b_low': 0.0, 'b_high': 1.0, 'i_low': 0, 'i_high': 50},
        {'b_low': 1.1, 'b_high': 2.0, 'i_low': 51, 'i_high': 100},
        {'b_low': 2.1, 'b_high': 10.0, 'i_low': 101, 'i_high': 200},
        {'b_low': 10.1, 'b_high': 17.0, 'i_low': 201, 'i_high': 300},
        {'b_low': 17.1, 'b_high': 34.0, 'i_low': 301, 'i_high': 400},
        {'b_low': 34.1, 'b_high': 50.0, 'i_low': 401, 'i_high': 500},
    ],
    'o3': [
        {'b_low': 0, 'b_high': 50, 'i_low': 0, 'i_high': 50},
        {'b_low': 51, 'b_high': 100, 'i_low': 51, 'i_high': 100},
        {'b_low': 101, 'b_high': 168, 'i_low': 101, 'i_high': 200},
        {'b_low': 169, 'b_high': 208, 'i_low': 201, 'i_high': 300},
        {'b_low': 209, 'b_high': 748, 'i_low': 301, 'i_high': 400},
        {'b_low': 749, 'b_high': 1000, 'i_low': 401, 'i_high': 500},
    ]
}

def calculate_pollutant_sub_index(pollutant: str, val: Optional[float]) -> Optional[int]:
    if val is None or val < 0:
        return None
    ranges = CPCB_BREAKPOINTS.get(pollutant.lower())
    if not ranges:
        return None
    for r in ranges:
        if val >= r['b_low'] and val <= r['b_high']:
            sub = r['i_low'] + ((r['i_high'] - r['i_low']) / (r['b_high'] - r['b_low'])) * (val - r['b_low'])
            return round(sub)
    if val > ranges[-1]['b_high']:
        return 500
    return 0

def get_aqi_category_name(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"

def evaluate_cpcb_aqi(pollutants: Dict[str, Optional[float]]) -> Dict[str, Any]:
    sub_indices: Dict[str, int] = {}
    valid_count = 0
    has_pm = False

    for k, v in pollutants.items():
        if v is not None:
            sub = calculate_pollutant_sub_index(k, v)
            if sub is not None:
                sub_indices[k] = sub
                valid_count += 1
                if k.lower() in ['pm25', 'pm10']:
                    has_pm = True

    if valid_count == 0:
        return {
            "aqi": None,
            "category": None,
            "dominant_pollutant": None,
            "sub_indices": {},
            "is_valid": False,
            "status_note": "No valid pollutant concentrations provided."
        }

    max_sub = -1
    dominant = None
    for k, s in sub_indices.items():
        if s > max_sub:
            max_sub = s
            dominant = k.upper()

    meets_strict = (valid_count >= 3 and has_pm)
    note = "Official CPCB Multi-Pollutant Index" if meets_strict else "Estimated AQI based on available indicators"

    return {
        "aqi": max_sub,
        "category": get_aqi_category_name(max_sub),
        "dominant_pollutant": dominant,
        "sub_indices": sub_indices,
        "is_valid": True,
        "status_note": note
    }
