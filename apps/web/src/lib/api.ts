const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`Error requesting ${endpoint}:`, err);
    throw err;
  }
}

export async function getStations(params?: { city?: string; state?: string }) {
  const query = new URLSearchParams();
  if (params?.city) query.append('city', params.city);
  if (params?.state) query.append('state', params.state);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  const data = await fetchFromAPI(`/stations${qStr}`);
  return data.data;
}

export async function getStationById(id: string) {
  const data = await fetchFromAPI(`/stations/${id}`);
  return data.data;
}

export async function getStationHistory(id: string, limit: number = 48) {
  const data = await fetchFromAPI(`/stations/${id}/history?limit=${limit}`);
  return data.data;
}

export async function getSourceAttribution(stationId?: string) {
  const endpoint = stationId ? `/air-quality/attribution?stationId=${stationId}` : `/air-quality/attribution`;
  const data = await fetchFromAPI(endpoint);
  return data;
}

export async function getHotspots() {
  const data = await fetchFromAPI(`/air-quality/hotspots`);
  return data.data;
}

export async function getFires() {
  const data = await fetchFromAPI(`/air-quality/fires`);
  return data.data;
}

export async function getWeather(lat?: number, lon?: number) {
  const q = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
  const data = await fetchFromAPI(`/air-quality/weather${q}`);
  return data.data;
}

export async function getForecast(stationId?: string) {
  const q = stationId ? `?stationId=${stationId}` : '';
  const data = await fetchFromAPI(`/air-quality/forecast${q}`);
  return data;
}

export async function getSystemStatus() {
  const data = await fetchFromAPI(`/admin/system-status`);
  return data;
}

export async function runPredictConcentrations(payload: any) {
  const data = await fetchFromAPI(`/air-quality/predict`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data;
}
