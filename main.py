import sys
import os
import argparse
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import sqlite3

# rail_scheduler.py se AI function import karein
from rail_scheduler import get_schedule_recommendations

# --- Database Setup ---
DB_FILE = "metrominds.db"

def init_db():
    """Initializes the database and creates the constraints table if it doesn't exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS constraints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trainId TEXT NOT NULL,
            fitnessDate TEXT NOT NULL,
            jobCardStatus TEXT NOT NULL,
            brandingPriority TEXT NOT NULL,
            mileage INTEGER NOT NULL,
            cleaningSlot TEXT NOT NULL,
            stablingPosition TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# --- Flask App Setup ---
app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# --- Frontend Routes ---
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# --- API Endpoints ---

@app.route('/api/constraints', methods=['POST'])
def add_constraint():
    """Receives constraint data from the form and saves it to the database."""
    data = request.json
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO constraints (trainId, fitnessDate, jobCardStatus, brandingPriority, mileage, cleaningSlot, stablingPosition)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['trainId'],
            data['fitnessDate'],
            data['jobCardStatus'],
            data['brandingPriority'],
            data['mileage'],
            data['cleaningSlot'],
            data['stablingPosition']
        ))
        conn.commit()
        conn.close()
        return jsonify({"message": "Constraint added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedules', methods=['GET'])
def get_schedules_api():
    """
    Reads constraints from the database, passes them to the AI model,
    and returns the generated schedule.
    """
    start_date_str = request.args.get('start')
    end_date_str = request.args.get('end')

    if not start_date_str or not end_date_str:
        return jsonify({"error": "Please provide both start and end dates"}), 400

    try:
        # Database se constraints data read karein
        conn = sqlite3.connect(DB_FILE)
        constraints_df = pd.read_sql_query("SELECT * FROM constraints", conn)
        conn.close()

        if constraints_df.empty:
            return jsonify({"message": "No constraints data found. Please add constraints first."}), 404

        # AI model ko call karein
        # Note: rail_scheduler.py ko bhi update karna padega taaki wo is data ko sahi se use kare
        schedule_df = get_schedule_recommendations(constraints_df, start_date_str, end_date_str)
        
        # DataFrame ko JSON format me convert karein
        schedule_json = schedule_df.to_dict(orient='records')
        
        # Frontend ko response bhejein
        return jsonify(schedule_json)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Server Start ---
if __name__ == '__main__':
    init_db()  # Database initialize karein
    app.run(host='0.0.0.0', port=5000, debug=True)