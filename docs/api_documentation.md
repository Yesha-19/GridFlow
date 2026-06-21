# Gridflow API Documentation

The Gridflow backend is built with FastAPI. All endpoints are prefixed with `/api`.

## 1. Predictions & Forecasting

### `POST /api/prediction`
Generates a congestion forecast for a planned event.
- **Request Body:**
  ```json
  {
    "eventName": "Diwali Festival",
    "eventType": "festival",
    "eventDateTime": "2026-10-24T18:00:00Z",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "locationName": "MG Road",
    "expectedCrowdSize": 5000
  }
  ```
- **Response:** Returns the created `Event` and `Prediction` objects, including the `congestion_risk_score` (0-100) and `estimated_delay_minutes`.

## 2. Validation Loop

### `GET /api/validation/history`
Fetches a list of up to 50 recent events and their validation status. Used to populate the Validation dashboard.
- **Response:** Array of events with both predicted and (if validated) actual outcomes.

### `POST /api/validation/{event_id}`
Submits the ground-truth actual data for an event after it has concluded.
- **Request Body:**
  ```json
  {
    "actualCrowdSize": 5500,
    "actualDelayMinutes": 45,
    "actualRiskScore": 75,
    "actualResourceUsage": "40 officers, 10 barricades",
    "notes": "Crowd was larger than expected."
  }
  ```
- **Response:** Returns the validation record, including the newly calculated `accuracyPercent`.

### `POST /api/validation/manual-event`
Creates a standalone event purely for historical validation logging (when no prior forecast was generated).

## 3. Analytics & Dashboard

### `GET /api/analytics`
Aggregates data across all events, predictions, and validations for the main dashboard.
- **Response:**
  - `totalEvents`: Count of all tracked events.
  - `avgAccuracy`: Average accuracy of the ML model across validated events.
  - `topCongestionZones`: Top 5 locations by average risk score.
  - `eventTypeBreakdown`: Breakdown of events by category.
  - `monthlyTrend` / `accuracyTrend`: Time-series data for charting.

## 4. Recommendations

### `POST /api/recommendations`
*(Internal)* Generates dynamic deployment recommendations (Manpower, Barricades, CCTV, Drones) based on a specific congestion risk score. Used internally by the prediction pipeline to generate actionable insights.
