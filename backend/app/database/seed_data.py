"""
seed_data.py — Populate the database with historical events from the Astram dataset
and synthesized planned events for demo.
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import select, func

from app.database.db import get_session
from app.database.models import Event, Prediction, Validation

_DATASET_DIR = Path(__file__).resolve().parent.parent.parent.parent / "datasets"

# Bengaluru landmarks for synthesized planned events
BENGALURU_VENUES = [
    {"name": "Chinnaswamy Stadium", "lat": 12.9788, "lng": 77.5996, "zone": "Central"},
    {"name": "Palace Grounds", "lat": 13.0070, "lng": 77.5725, "zone": "North"},
    {"name": "Kanteerava Stadium", "lat": 12.9756, "lng": 77.5928, "zone": "Central"},
    {"name": "Freedom Park", "lat": 12.9770, "lng": 77.5734, "zone": "Central"},
    {"name": "Lalbagh Botanical Garden", "lat": 12.9507, "lng": 77.5848, "zone": "South"},
    {"name": "Cubbon Park", "lat": 12.9763, "lng": 77.5929, "zone": "Central"},
    {"name": "Vidhana Soudha", "lat": 12.9796, "lng": 77.5907, "zone": "Central"},
    {"name": "MG Road", "lat": 12.9758, "lng": 77.6069, "zone": "East"},
    {"name": "Commercial Street", "lat": 12.9822, "lng": 77.6089, "zone": "East"},
    {"name": "Marathahalli Junction", "lat": 12.9561, "lng": 77.7019, "zone": "East"},
    {"name": "Koramangala", "lat": 12.9352, "lng": 77.6245, "zone": "South-East"},
    {"name": "Jayanagar", "lat": 12.9253, "lng": 77.5831, "zone": "South"},
    {"name": "Malleshwaram", "lat": 13.0035, "lng": 77.5686, "zone": "West"},
    {"name": "Rajajinagar", "lat": 12.9916, "lng": 77.5541, "zone": "West"},
    {"name": "Whitefield", "lat": 12.9698, "lng": 77.7500, "zone": "East"},
]

PLANNED_EVENTS = [
    {
        "name": "Ganesh Chaturthi Procession — MG Road",
        "event_type": "religious_festival",
        "crowd_size": 45000,
        "duration_hours": 6,
        "venue_idx": 7,
    },
    {
        "name": "IPL Match — RCB vs CSK",
        "event_type": "sports_event",
        "crowd_size": 40000,
        "duration_hours": 4,
        "venue_idx": 0,
    },
    {
        "name": "State Assembly Election Rally",
        "event_type": "political_rally",
        "crowd_size": 60000,
        "duration_hours": 3,
        "venue_idx": 3,
    },
    {
        "name": "Republic Day Parade",
        "event_type": "vip_movement",
        "crowd_size": 80000,
        "duration_hours": 4,
        "venue_idx": 6,
    },
    {
        "name": "Diwali Festival Celebration — Lalbagh",
        "event_type": "religious_festival",
        "crowd_size": 35000,
        "duration_hours": 5,
        "venue_idx": 4,
    },
    {
        "name": "Farmers Union Highway Protest",
        "event_type": "protest_strike",
        "crowd_size": 15000,
        "duration_hours": 8,
        "venue_idx": 9,
    },
    {
        "name": "Independence Day Cultural Concert",
        "event_type": "cultural_event",
        "crowd_size": 22000,
        "duration_hours": 5,
        "venue_idx": 1,
    },
    {
        "name": "Bengaluru Marathon 2024",
        "event_type": "sports_event",
        "crowd_size": 25000,
        "duration_hours": 6,
        "venue_idx": 5,
    },
    {
        "name": "Karaga Festival — Traditional Procession",
        "event_type": "religious_festival",
        "crowd_size": 55000,
        "duration_hours": 7,
        "venue_idx": 8,
    },
    {
        "name": "CM Road Show — Election Campaign",
        "event_type": "political_rally",
        "crowd_size": 70000,
        "duration_hours": 3,
        "venue_idx": 12,
    },
    {
        "name": "New Year Concert at Palace Grounds",
        "event_type": "cultural_event",
        "crowd_size": 30000,
        "duration_hours": 5,
        "venue_idx": 1,
    },
    {
        "name": "Auto Expo 2024 — Whitefield",
        "event_type": "cultural_event",
        "crowd_size": 18000,
        "duration_hours": 8,
        "venue_idx": 14,
    },
]


def _compute_predicted_score(event_data: dict) -> float:
    """Compute a deterministic predicted score for seeded events."""
    random.seed(hash(event_data["name"]) % 2**32)

    type_weights = {
        "political_rally": 0.85,
        "religious_festival": 0.75,
        "sports_event": 0.65,
        "cultural_event": 0.55,
        "protest_strike": 0.90,
        "vip_movement": 0.70,
    }
    type_w = type_weights.get(event_data["event_type"], 0.6)
    crowd_factor = min(event_data["crowd_size"] / 50000, 1.0)
    duration_factor = min(event_data["duration_hours"] / 8, 1.0)

    score = type_w * 55 + crowd_factor * 35 + duration_factor * 10
    noise = random.uniform(-5, 5)
    return round(max(4, min(98, score + noise)), 1)


async def seed_historical_data():
    """Seed the database with historical events for demo."""
    async with get_session() as session:
        # Check if already seeded
        result = await session.execute(select(func.count(Event.id)))
        count = result.scalar()
        if count > 0:
            print(f"[seed] Database already has {count} events, skipping seed")
            return

        print("[seed] Seeding historical events...")
        random.seed(42)

        for i, event_data in enumerate(PLANNED_EVENTS):
            venue = BENGALURU_VENUES[event_data["venue_idx"]]

            # Create event at different past dates
            days_ago = (len(PLANNED_EVENTS) - i) * 15 + random.randint(1, 10)
            event_date = datetime.utcnow() - timedelta(days=days_ago)
            event_date = event_date.replace(hour=random.choice([9, 10, 14, 16, 17, 18]))

            event = Event(
                name=event_data["name"],
                event_type=event_data["event_type"],
                is_planned=True,
                latitude=venue["lat"] + random.uniform(-0.003, 0.003),
                longitude=venue["lng"] + random.uniform(-0.003, 0.003),
                location_name=venue["name"],
                crowd_size=event_data["crowd_size"],
                start_time=event_date,
                duration_hours=event_data["duration_hours"],
                status="completed",
                description=f"Historical event at {venue['name']}",
            )
            session.add(event)
            await session.flush()

            # Create prediction
            predicted_score = _compute_predicted_score(event_data)
            risk_level = (
                "critical" if predicted_score >= 80 else
                "high" if predicted_score >= 60 else
                "medium" if predicted_score >= 35 else
                "low"
            )
            delay = int(8 + (predicted_score / 100) * 65 + random.uniform(-5, 5))
            radius = round(1.2 + (predicted_score / 100) * 3.6, 1)

            prediction = Prediction(
                event_id=event.id,
                congestion_risk_score=predicted_score,
                risk_level=risk_level,
                peak_congestion_time=event_date + timedelta(minutes=int(event_data["duration_hours"] * 24)),
                congestion_duration_minutes=int(event_data["duration_hours"] * 40),
                impact_radius_km=radius,
                confidence_score=round(72 + random.uniform(0, 20), 1),
                estimated_delay_minutes=delay,
            )
            session.add(prediction)
            await session.flush()

            # Create validation (some validated, some pending)
            is_validated = i < len(PLANNED_EVENTS) - 2
            drift = random.uniform(-12, 12)
            actual_score = round(max(4, min(98, predicted_score + drift)), 1) if is_validated else None
            actual_delay = max(4, delay + random.randint(-15, 15)) if is_validated else None
            accuracy = round(100 - abs(drift), 1) if is_validated else None

            validation = Validation(
                event_id=event.id,
                prediction_id=prediction.id,
                actual_congestion_score=actual_score,
                actual_delay_minutes=actual_delay,
                accuracy_percentage=accuracy,
                score_delta=round(drift, 1) if is_validated else None,
                validated=is_validated,
            )
            session.add(validation)

        await session.commit()
        print(f"[seed] Seeded {len(PLANNED_EVENTS)} historical events ✓")
