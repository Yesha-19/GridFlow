"""
routing.py — POST /api/routing endpoint.

Generates affected road segments and diversion routes using the event
location and predicted congestion radius.
"""

import math
import random
from datetime import datetime, timedelta

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class RoutingEventInput(BaseModel):
    event: dict
    prediction: dict


class AffectedRoute(BaseModel):
    id: str
    name: str
    congestionLevel: str
    coordinates: list[list[float]]


class DiversionRoute(BaseModel):
    id: str
    name: str
    coordinates: list[list[float]]
    recommendedFor: str


class ClosureZone(BaseModel):
    center: list[float]
    radiusMeters: int


class RoutingResponse(BaseModel):
    affectedRoutes: list[AffectedRoute]
    diversionRoutes: list[DiversionRoute]
    closureZone: ClosureZone


# Bengaluru road names for realistic output
ROAD_NAMES = [
    "Outer Ring Road", "MG Road", "Brigade Road", "Residency Road",
    "Hosur Road", "Tumkur Road", "Mysore Road", "Bannerghatta Road",
    "Bellary Road", "Old Airport Road", "HAL Airport Road",
    "Sarjapur Road", "Whitefield Main Road", "ITPL Main Road",
    "Koramangala Inner Ring Road", "Jayanagar 4th Block Main Road",
    "Bull Temple Road", "Nrupatunga Road", "Kasturba Road",
    "St. Marks Road", "Cunningham Road", "Palace Road",
    "Sankey Road", "Sadashiva Nagar Main Road",
]

DIVERSION_TEMPLATES = [
    {"name": "Northern Bypass via Bellary Road", "for": "Heavy / commercial traffic"},
    {"name": "Southern Ring via Bannerghatta Road", "for": "Light vehicles & two-wheelers"},
    {"name": "Eastern Corridor via Old Airport Road", "for": "All vehicle types"},
]


def _offset(lat: float, lng: float, spread_km: float = 1.2, seed: int = 0) -> list[float]:
    """Generate a randomized point near the given coordinates."""
    rng = random.Random(seed)
    d_lat = (rng.random() - 0.5) * 0.018 * spread_km
    d_lng = (rng.random() - 0.5) * 0.018 * spread_km
    return [lat + d_lat, lng + d_lng]


def _generate_routes(lat: float, lng: float, score: int, seed_base: int) -> dict:
    """Generate realistic affected and diversion routes."""
    rng = random.Random(seed_base)

    # Pick road names based on score
    n_affected = 4 if score >= 60 else 3
    selected_roads = rng.sample(ROAD_NAMES, min(n_affected, len(ROAD_NAMES)))

    affected_routes = []
    for i, road_name in enumerate(selected_roads):
        angle = (i / n_affected) * math.pi * 2 + rng.random() * 0.4
        path = [
            [lat, lng],
            _offset(lat + math.sin(angle) * 0.01, lng + math.cos(angle) * 0.01, 1.4, seed_base + i * 10),
            _offset(lat + math.sin(angle) * 0.022, lng + math.cos(angle) * 0.022, 1.6, seed_base + i * 20),
        ]

        # Assign congestion level
        roll = score / 100 + (rng.random() - 0.5) * 0.3
        if i == 0 or roll > 0.7:
            level = "critical"
        elif roll > 0.45:
            level = "high"
        elif roll > 0.25:
            level = "moderate"
        else:
            level = "low"

        affected_routes.append({
            "id": f"affected-{i}",
            "name": f"{road_name} — Approach {i + 1}",
            "congestionLevel": level,
            "coordinates": path,
        })

    # Generate diversion routes
    diversion_routes = []
    for i, template in enumerate(DIVERSION_TEMPLATES[:2]):
        angle = (i / 2) * math.pi * 2 + math.pi / 4 + rng.random() * 0.3
        path = [
            _offset(lat, lng, 1.8, seed_base + 100 + i),
            _offset(lat + math.sin(angle) * 0.028, lng + math.cos(angle) * 0.028, 1.5, seed_base + 110 + i),
            _offset(lat + math.sin(angle) * 0.04, lng + math.cos(angle) * 0.04, 1.5, seed_base + 120 + i),
        ]
        diversion_routes.append({
            "id": f"diversion-{i}",
            "name": template["name"],
            "coordinates": path,
            "recommendedFor": template["for"],
        })

    return {
        "affectedRoutes": affected_routes,
        "diversionRoutes": diversion_routes,
    }


@router.post("/routing", response_model=RoutingResponse)
async def get_routing_plan(payload: RoutingEventInput):
    """Generate affected road segments and diversion routes."""
    event = payload.event
    prediction = payload.prediction

    lat = event.get("latitude", 12.9716)
    lng = event.get("longitude", 77.5946)
    score = prediction.get("congestionRiskScore", 50)
    radius_km = prediction.get("affectedRadiusKm", 1.5)

    # Generate a seed from event name for deterministic output
    seed_base = hash(event.get("eventName", "default")) % 2**31

    routes = _generate_routes(lat, lng, score, seed_base)

    return RoutingResponse(
        affectedRoutes=[AffectedRoute(**r) for r in routes["affectedRoutes"]],
        diversionRoutes=[DiversionRoute(**r) for r in routes["diversionRoutes"]],
        closureZone=ClosureZone(
            center=[lat, lng],
            radiusMeters=int(radius_km * 1000 * 0.35),
        ),
    )
