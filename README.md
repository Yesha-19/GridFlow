# GridFlow — Traffic Congestion Intelligence Platform

> **Real-time congestion forecasting and resource deployment for the Bengaluru Traffic Police.**

🌍 **Live Deployment:** [https://grid-flow-five.vercel.app](https://grid-flow-five.vercel.app)

Gridflow is an event-driven congestion prediction system that uses historical traffic data and machine learning (XGBoost) to forecast the impact of planned events (political rallies, sports matches, festivals) and unplanned incidents (accidents, tree falls, waterlogging). It recommends optimal manpower, barricading strategies, and diversion plans — before gridlock hits.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔮 **Congestion Forecasting** | ML-powered risk score (0–100) with LOW / MEDIUM / HIGH / CRITICAL classification |
| 🗺️ **Interactive Tactical Map** | Live heatmap overlay, deployment zones, and diversion route visualization |
| 👮 **Resource Planner** | Auto-generated police, traffic warden, barricade, CCTV, and ambulance recommendations |
| 📊 **Analytics Dashboard** | Hourly congestion curves, crowd flow data, and historical event comparison |
| ⏱️ **Event Timeline** | Phase-aware timeline (Setup → Build-up → Peak → Dispersal → All Clear) with operator resolve controls |
| ✅ **Model Validation** | Post-event accuracy tracking — compare predicted vs. actual congestion scores |
| 🌦️ **Weather Integration** | Live weather context panel for the event location |
| 📄 **PDF Briefing Export** | One-click operational briefing PDF for commanders |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Leaflet.js, Recharts |
| **Backend** | FastAPI, SQLAlchemy (async), Pydantic v2, Uvicorn |
| **Database** | PostgreSQL via asyncpg |
| **ML Pipeline** | XGBoost, scikit-learn, Pandas, NumPy |
| **Routing** | OSRM (Open Source Routing Machine) for road-snapped diversion routes |

---

## 📋 Prerequisites

Make sure the following are installed before you begin:

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js v18+ and npm** — [Download](https://nodejs.org/)
- **Git** — [Download](https://git-scm.com/)

---

## 🚀 Local Setup Guide

The app has two servers — a **FastAPI backend** and a **Vite React frontend**. You need **two separate terminal windows** running simultaneously.

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Yesha-19/GridFlow
cd GridFlow
```

---

### Step 2 — Set Up the Backend (Terminal 1)

#### 2a. Create and activate a Python virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2b. Install Python dependencies

```bash
pip install -r backend/requirements.txt
```

#### 2c. Configure the backend environment

The backend uses **PostgreSQL** for its database. Create a `backend/.env` file with your connection string and any optional variables:

```env
# Required: PostgreSQL connection string
DATABASE_URL="postgresql+asyncpg://user:password@localhost:5432/gridlock"

# Optional: Enable SQLAlchemy query logging (default: false)
# SQLALCHEMY_ECHO="false"
```
*(Note: If you use Supabase, provide an empty database. The server will auto-create tables and seed them with historical data on first run.)*

#### 2d. Set encoding and start the backend server

**Windows:**
```bash
set PYTHONIOENCODING=utf-8
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**macOS / Linux:**
```bash
export PYTHONIOENCODING=utf-8
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be running at: **`http://localhost:8000`**

You can verify it's healthy by visiting: **`http://localhost:8000/api/health`**

> ⚠️ **Note:** The first startup takes ~15–20 seconds as the database is created and seeded with historical data. Subsequent starts are instant.

---

### Step 3 — Set Up the Frontend (Terminal 2)

#### 3a. Navigate to the frontend directory

```bash
cd frontend
```

#### 3b. Install Node.js dependencies

```bash
npm install
```

#### 3c. Configure the frontend environment

Create a `.env` file inside the `frontend` directory. Here are the available variables you can configure:

```env
# Required: Point this to your local FastAPI server
VITE_API_BASE_URL="http://localhost:8000/api"

# Optional: Supabase credentials (if connecting to Supabase from the frontend)
VITE_SUPABASE_URL="your_supabase_url_here"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Optional: OpenWeatherMap API key for live weather data
VITE_OPENWEATHER_API_KEY="your_openweather_api_key_here"
```

#### 3d. Start the Vite development server

```bash
npm run dev
```

The frontend will be running at: **`http://localhost:5173`**

Open your browser and navigate to that URL.

---

## 🧭 How to Use the App

1. **Home / Console** (`/`) — Fill in event details (name, type, venue, attendance, time) and click **Generate Prediction**
2. **Dashboard** (`/dashboard`) — View the full forecast: risk score, map, resources, timeline, analytics
3. **Analytics** (`/analytics`) — Deep-dive into hourly congestion curves and crowd flow models
4. **Validation** (`/validation`) — After an event occurs, log actual outcomes to track model accuracy
5. **Mark as Resolved** — Once an event reaches Dispersal phase, use the timeline button to close it out

---

## 📁 Project Structure

```
GridFlow-AI/
├── backend/                   # FastAPI server
│   ├── app/
│   │   ├── api/               # Route handlers (predict, validation, routing, analytics)
│   │   ├── database/          # SQLAlchemy models and DB connection
│   │   ├── services/          # ML inference, resource planning, knowledge base
│   │   └── main.py            # FastAPI app entry point
│   ├── requirements.txt
│   └── reset_db.py            # Utility to wipe and reseed the database
│
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # UI components (Map, Timeline, ResourcePanel, etc.)
│   │   ├── pages/             # Route pages (Home, Dashboard, Analytics, Validation)
│   │   ├── services/          # API client functions
│   │   ├── context/           # React context (EventContext, AuthContext)
│   │   ├── hooks/             # Custom hooks (useCountdown, etc.)
│   │   └── utils/             # Helpers, constants, mock data generators
│   └── package.json
│
├── ml/                        # Machine learning pipeline
│   ├── pipelines/
│   │   ├── feature_engineering.py
│   │   └── inference_pipeline.py
│   ├── models/                # Trained model files (congestion_model.pkl, scaler.pkl)
│   ├── train_model.py         # Retrain the XGBoost model
│   └── evaluate.py            # Evaluate model performance
│
├── datasets/                  # Historical Bengaluru traffic event data (anonymized)
└── README.md
```

---

## 🔁 (Optional) Retraining the ML Model

The trained XGBoost model is already included in `ml/models/`. Only retrain if you update the dataset.

```bash
# Activate virtual environment first
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# Set encoding
set PYTHONIOENCODING=utf-8     # Windows
export PYTHONIOENCODING=utf-8  # macOS / Linux

# Run training
python ml/train_model.py

# Evaluate performance
python ml/evaluate.py
```

---

## 🛠️ Troubleshooting

### ❌ `Forecast failed` / `Request failed with status code 422`
- Make sure the backend is running on port 8000
- Check that all required form fields are filled in (Event Name, Attendance ≥ 30, Duration > 0)
- Open browser DevTools → Console to see the exact validation error

### ❌ `timeout of 60000ms exceeded`
- The backend is not running — start it using Step 2d above
- Run `http://localhost:8000/api/health` in your browser to verify

### ❌ `ModuleNotFoundError` on backend start
- Make sure your virtual environment is activated: `venv\Scripts\activate`
- Re-run: `pip install -r backend/requirements.txt`

### ❌ Map not loading / blank tiles
- This requires an internet connection (tiles are loaded from CartoDB CDN)
- Check your firewall or network settings

### ❌ Database errors on first run
- Delete `backend/gridlock_demo.db` and restart the backend — it will be recreated automatically
- Or run: `python backend/reset_db.py`

---


## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built for the Bengaluru Traffic Police · Powered by XGBoost + FastAPI + React</sub>
</div>
