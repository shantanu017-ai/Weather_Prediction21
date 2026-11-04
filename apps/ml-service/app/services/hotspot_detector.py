import math
import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import DBSCAN
from ..schemas.ml_schemas import SpatialHotspotInput, SpatialHotspotOutput, HotspotCluster, GeoPoint

def detect_spatial_hotspots(input_data: SpatialHotspotInput) -> SpatialHotspotOutput:
    if len(input_data.points) < 2:
        return SpatialHotspotOutput(clusters_count=0, clusters=[])

    # Convert coordinates to radians for haversine DBSCAN
    coords = np.array([[math.radians(p.latitude), math.radians(p.longitude)] for p in input_data.points])
    
    # 6371 km Earth radius
    # eps in radians = eps_km / 6371.0
    eps_rad = (input_data.eps_km or 15.0) / 6371.0
    min_samples = input_data.min_samples or 2

    clustering = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine').fit(coords)
    labels = clustering.labels_

    clusters: List[HotspotCluster] = []
    unique_labels = set(labels)

    for cluster_id in unique_labels:
        if cluster_id == -1:
            # Noise points
            continue

        member_indices = [i for i, lbl in enumerate(labels) if lbl == cluster_id]
        member_points = [input_data.points[i] for i in member_indices]

        # Calculate centroid
        avg_lat = sum(p.latitude for p in member_points) / len(member_points)
        avg_lon = sum(p.longitude for p in member_points) / len(member_points)
        avg_pm25 = sum(p.pm25 for p in member_points) / len(member_points)
        avg_pm10 = sum(p.pm10 for p in member_points) / len(member_points)
        avg_aqi = round(sum(p.aqi for p in member_points) / len(member_points))

        # Approximate max radius from centroid in meters
        max_dist_m = 0.0
        for p in member_points:
            dlat = (p.latitude - avg_lat) * 111320
            dlon = (p.longitude - avg_lon) * 111320 * math.cos(math.radians(avg_lat))
            dist = math.sqrt(dlat**2 + dlon**2)
            if dist > max_dist_m:
                max_dist_m = dist

        radius_m = max(1500.0, max_dist_m * 1.3)

        # Severity level based on average AQI
        if avg_aqi <= 100:
            severity = "Low"
        elif avg_aqi <= 200:
            severity = "Moderate"
        elif avg_aqi <= 300:
            severity = "High"
        else:
            severity = "Critical"

        # Convex hull / circular polygon perimeter coordinates (12-sided polygon approximation)
        hull_coords = []
        for angle_deg in range(0, 360, 30):
            rad = math.radians(angle_deg)
            lat_offset = (radius_m / 111320.0) * math.cos(rad)
            lon_offset = (radius_m / (111320.0 * math.cos(math.radians(avg_lat)))) * math.sin(rad)
            hull_coords.append([round(avg_lat + lat_offset, 5), round(avg_lon + lon_offset, 5)])
        hull_coords.append(hull_coords[0]) # close polygon

        clusters.append(HotspotCluster(
            cluster_id=int(cluster_id),
            centroid=GeoPoint(latitude=round(avg_lat, 5), longitude=round(avg_lon, 5)),
            radius_meters=round(radius_m, 1),
            avg_pm25=round(avg_pm25, 1),
            avg_pm10=round(avg_pm10, 1),
            avg_aqi=avg_aqi,
            severity_level=severity,
            contributing_stations=len(member_points),
            hull_coordinates=hull_coords
        ))

    # Sort by severity / AQI descending
    clusters.sort(key=lambda c: c.avg_aqi, reverse=True)

    return SpatialHotspotOutput(
        clusters_count=len(clusters),
        clusters=clusters
    )
