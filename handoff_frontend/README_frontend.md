Frontend Handoff

This folder contains a brief API contract and a sample Streamlit UI to integrate with the backend.

API contract (see api_contract.json) — endpoints used by frontend:
- POST /predict
- POST /schedule
- GET /model/status

Suggested frontend features
- Upload recent passenger CSV or request server default prediction
- Visualize predictions (plot) and schedule (table)
- Display model metrics and feature importances
- Allow operator to trigger re-opt or download assignments.csv

Streamlit quickstart (sample provided): run `streamlit run sample_ui_streamlit.py` and point to the backend host.
