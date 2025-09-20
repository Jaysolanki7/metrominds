Backend Handoff

This folder contains artifacts and instructions for the backend team to serve the forecasting + scheduling model.

Files included (references)
- models/passenger_forecast.pkl    (path in repo)
- src/prediction.py                (feature engineering, model wrapper)
- src/data_ingestion.py            (data loading + feature engineering)
- src/optimization.py              (CP-SAT optimizer; fallback)
- src/ga_scheduler.py              (GA optimizer)
- constraints_example.json         (example constraints schema)

Quick start for backend engineers
1. Create a Python environment and install requirements from `requirements.txt` in project root.

2. Implement a small service (FastAPI suggested) that:
   - Loads the model from `models/passenger_forecast.pkl` using joblib
   - Exposes endpoints: /health, /predict, /schedule, /model/status
   - For /predict: accept recent rows or raw features, run the same feature engineering from `src/data_ingestion.feature_engineering` and call the model
   - For /schedule: accept predictions or call /predict and then call optimizer (choose `ga` or `cp_sat`)

3. Example curl for predict (replace host/port):
   curl -X POST "http://localhost:8000/predict" -H "Content-Type: application/json" -d '{"horizon":24}'

Constraints & sample
- See `constraints_example.json` in this folder for a minimal schema the frontend can use to build UI.

Notes
- OR-Tools (CP-SAT) is optional; the repo falls back to a deterministic scheduler when OR-Tools is not available.
- Persist observed data and request logs for retraining and monitoring.
