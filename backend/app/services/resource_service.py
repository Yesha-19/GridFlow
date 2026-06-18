"""
resource_service.py — Resource recommendation engine.

Computes zone-wise personnel allocation, barricade placement,
and deployment recommendations based on predicted congestion severity.
"""

import math
import random


def compute_resource_plan(
    congestion_score: float,
    crowd_size: int,
    event_type: str,
    latitude: float,
    longitude: float,
    duration_hours: float,
) -> dict:
    """
    Generate a complete resource deployment plan.

    Returns dict with personnel counts, barricade count, CCTV units,
    ambulance standby, and zone-wise deployment breakdown.
    """
    # Use consistent random based on inputs
    rng = random.Random(hash(f"{latitude}{longitude}{crowd_size}") % 2**31)

    # Scale factors
    attendance_factor = min(crowd_size / 50000, 1.0)
    score_factor = congestion_score / 100.0

    # Type-specific multipliers
    type_multipliers = {
        "political_rally": 1.4,
        "religious_festival": 1.2,
        "sports_event": 1.1,
        "cultural_event": 1.0,
        "protest_strike": 1.5,
        "vip_movement": 1.3,
    }
    type_mult = type_multipliers.get(event_type, 1.0)

    # ── Personnel calculation ──────────────────────────────
    base_officers = 6 + attendance_factor * 40 + score_factor * 20
    police_personnel = int(base_officers * type_mult + rng.uniform(0, 5))
    traffic_wardens = int(police_personnel * 0.55 + rng.uniform(0, 3))

    # ── Barricades ─────────────────────────────────────────
    barricades = int(20 + attendance_factor * 140 + score_factor * 30 + rng.uniform(0, 10))

    # ── CCTV & ambulance ───────────────────────────────────
    cctv_units = int(4 + attendance_factor * 16 + rng.uniform(0, 3))
    ambulance_standby = max(1, int(1 + attendance_factor * 5))

    # ── Deployment zones ───────────────────────────────────
    zone_configs = [
        {"name": "Main Entry Gate", "spread": 0.004, "priority_order": 0},
        {"name": "VIP / Stage Approach", "spread": 0.005, "priority_order": 1},
        {"name": "North Junction", "spread": 0.007, "priority_order": 2},
        {"name": "South Service Road", "spread": 0.008, "priority_order": 3},
        {"name": "Parking Overflow Lot", "spread": 0.009, "priority_order": 4},
    ]

    zone_count = 5 if congestion_score >= 60 else 4 if congestion_score >= 35 else 3
    zones = []

    for i, config in enumerate(zone_configs[:zone_count]):
        angle = (i / zone_count) * 2 * math.pi + rng.uniform(0, 0.5)
        zone_lat = latitude + math.sin(angle) * config["spread"]
        zone_lng = longitude + math.cos(angle) * config["spread"]

        if i == 0:
            priority = "critical"
        elif i == 1:
            priority = "high"
        elif rng.random() > 0.5:
            priority = "moderate"
        else:
            priority = "low"

        personnel_count = max(2, int(
            (congestion_score / 100) * 18 - i * 2 + rng.uniform(0, 4)
        ))

        zones.append({
            "id": f"zone-{i}",
            "name": config["name"],
            "lat": round(zone_lat, 6),
            "lng": round(zone_lng, 6),
            "personnelCount": personnel_count,
            "priority": priority,
        })

    return {
        "policePersonnel": police_personnel,
        "trafficWardens": traffic_wardens,
        "barricades": barricades,
        "cctvUnits": cctv_units,
        "ambulanceStandby": ambulance_standby,
        "deploymentZones": zones,
    }
