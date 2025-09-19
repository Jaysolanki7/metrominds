# Prototype: Train Capacity Forecasting & Scheduling

This repository contains a prototype pipeline that forecasts short-term passenger demand and produces train schedules based on those forecasts. It includes a RandomForest forecasting model, two scheduling approaches (CP-SAT when available and a Genetic Algorithm), basic decision-support artifacts, and a simple automation entrypoint.

Key components
- `src/data_ingestion.py` — passenger data loader, event merge, and simple CSV loaders for schedules/drivers/tracks.
- `src/prediction.py` — RandomForest training, RMSE/MAPE evaluation, and helper to estimate trains required by capacity.
- `src/optimization.py` — CP-SAT scheduler (first pass) with a deterministic fallback.
- `src/ga_scheduler.py` — Genetic Algorithm-based scheduler.
- `src/automation.py` — pipeline orchestration (ingest → train → predict → optimize → export).
- `src/decision_support.py` — generates a small JSON report and human-readable recommendations.

Quick start
1. Create and activate a Python environment (recommended Python 3.10+).
2. Install requirements:

```powershell
pip install -r requirements.txt
```

3. Run the pipeline (example):

```powershell
python main.py --models-dir test_models --output-dir test_output --optimizer ga --feedback --reopt-threshold 0.05
```

Outputs
- `test_output/metrics.json` — model evaluation metrics (R², RMSE, MAPE).
- `test_output/predictions.csv` — 24-hour passenger forecasts.
- `test_output/schedule.csv` and `schedule_reopt.csv` — suggested schedules.
- `test_output/assignments.csv` — per-slot assignments (best-effort round-robin when detailed solver output not available).
- `test_output/decision_report.json` and `recommendations.txt` — basic decision support.

Notes & next steps
- This is a prototype — CP-SAT model and GA need extension to handle complex constraints and to produce per-train assignments from solver outputs.
- You can improve the forecasting model, add a retraining pipeline, and standardize `constraints.json` for production usage.

Contributing
- See `CONTRIBUTING.md` for contribution guidelines.