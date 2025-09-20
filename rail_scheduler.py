import pandas as pd
import numpy as np
from math import ceil
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
import os

# For optimization
from ortools.sat.python import cp_model

# CONFIGURATION
CONFIG = {
    "time_bucket": "h",                 # hourly buckets ('H' is deprecated)
    "n_days": 30,
    "routes": ["Route_A", "Route_B", "Route_C"],
    "start_date": "2025-01-01",
    "seed": 42,
    "occupancy_target": 0.8,            # plan for 80% target occupancy
    "num_trains": 6,
    "num_drivers": 8,
    "num_tracks": 3,
    "features": [
        "hour", "day_of_week", "is_weekend", "is_night", "event_size", "is_event_window",
        "passenger_demand", "lag_1", "lag_24", "rolling_3", "rolling_6", "rolling_24",
        "baseline_required_trains", "greedy_min_trains"
    ]
}
np.random.seed(CONFIG["seed"])

# ---------------------------
# STEP 1: SYNTHETIC DATA GENERATION
# ---------------------------
def generate_synthetic_demand(n_days=30, time_freq="h", routes=None, start_date="2025-01-01"):
    if routes is None:
        routes = ["Route_A", "Route_B"]
    slots = int(n_days * (24 if time_freq == "h" else 1))
    timestamps = pd.date_range(start=start_date, periods=slots, freq=time_freq)
    rows = []
    event_calendar = []
    event_days = np.random.choice(pd.date_range(start_date, periods=n_days).date, size=max(1, n_days//7), replace=False)
    event_days = set(event_days)
    for route in routes:
        base = {"Route_A": 220, "Route_B": 160, "Route_C": 90}.get(route, 120)
        for ts in timestamps:
            hour = ts.hour
            dow = ts.dayofweek
            rush_factor = 1.6 if hour in (7,8,9,17,18) else (1.1 if hour in (6,10,16,19) else 1.0)
            weekend_factor = 0.85 if dow >= 5 else 1.0
            event_factor = 1.0
            if ts.date() in event_days and np.random.rand() < 0.9:
                event_factor = 1.2 + np.random.rand()*0.5
                event_calendar.append({"timestamp": ts, "route": route, "event_size": int(100 + np.random.rand()*900)})
            weather_r = np.random.rand()
            weather_factor = 0.9 if weather_r < 0.05 else 1.0
            noise = np.random.normal(scale=18)
            demand = max(0, int(base * rush_factor * weekend_factor * event_factor * weather_factor + noise))
            rows.append((ts, route, hour, dow, demand))
    df = pd.DataFrame(rows, columns=["timestamp", "route", "hour", "day_of_week", "passenger_demand"])
    events = pd.DataFrame(event_calendar).drop_duplicates().reset_index(drop=True) if event_calendar else pd.DataFrame(columns=["timestamp","route","event_size"])
    return df, events

def generate_train_driver_track_metadata(num_trains=6, num_drivers=8, num_tracks=3):
    capacities = [350, 300, 280, 220, 180, 150][:num_trains]
    trains = pd.DataFrame({
        "train_id": [f"T{i+1}" for i in range(len(capacities))],
        "capacity": capacities,
        "status": ["available"]*len(capacities)
    })
    drivers = pd.DataFrame({
        "driver_id": [f"D{i+1}" for i in range(num_drivers)],
        "max_hours": [8]*num_drivers,
        "status": ["available"]*num_drivers
    })
    tracks = pd.DataFrame({
        "track_id": [f"TR{i+1}" for i in range(num_tracks)],
        "status": ["available"]*num_tracks
    })
    return trains, drivers, tracks

def inject_missingness(df, frac_missing=0.02):
    df = df.copy()
    n = len(df)
    miss_idx = np.random.choice(n, size=int(n*frac_missing), replace=False)
    df.loc[miss_idx, "passenger_demand"] = np.nan
    return df

# STEP 2: DATA PREPROCESSING
def preprocess_demand(demand_df, events_df=None, occupancy_target=0.8, trains_df=None):
    df = demand_df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["route","timestamp"]).reset_index(drop=True)
    # Missing values
    df["passenger_demand"] = df.groupby("route")["passenger_demand"].transform(
        lambda s: s.interpolate(limit_direction="both"))
    route_medians = df.groupby("route")["passenger_demand"].transform("median")
    df["passenger_demand"] = df["passenger_demand"].fillna(route_medians)
    # Outlier clipping
    q99 = df["passenger_demand"].quantile(0.999)
    df["passenger_demand"] = df["passenger_demand"].clip(lower=0, upper=q99*1.2)
    # Time features
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"] >= 5
    df["date"] = df["timestamp"].dt.date
    df["month"] = df["timestamp"].dt.month
    df["is_night"] = df["hour"].isin([0,1,2,3,4])
    # Event features
    if events_df is not None and not events_df.empty:
        events_df = events_df.copy()
        events_df["timestamp"] = pd.to_datetime(events_df["timestamp"])
        events_lookup = events_df.set_index(["timestamp","route"])["event_size"].to_dict()
        df["event_size"] = df.apply(lambda r: events_lookup.get((r["timestamp"], r["route"]), 0), axis=1)
        event_ts_by_route = events_df.groupby("route")["timestamp"].apply(list).to_dict()
        def in_event_window(row, pre=2, post=3):
            ts = row["timestamp"]
            route = row["route"]
            if route not in event_ts_by_route: 
                return 0
            for et in event_ts_by_route[route]:
                if (et - pd.Timedelta(hours=pre)) <= ts <= (et + pd.Timedelta(hours=post)):
                    return 1
            return 0
        df["is_event_window"] = df.apply(in_event_window, axis=1)
    else:
        df["event_size"] = 0
        df["is_event_window"] = 0
    # Lag features and rolling statistics
    grp = df.groupby("route", group_keys=False)
    df["lag_1"] = grp["passenger_demand"].shift(1)
    df["lag_24"] = grp["passenger_demand"].shift(24)
    df["rolling_3"] = grp["passenger_demand"].rolling(window=3, min_periods=1).mean().reset_index(level=0,drop=True)
    df["rolling_6"] = grp["passenger_demand"].rolling(window=6, min_periods=1).mean().reset_index(level=0,drop=True)
    df["rolling_24"] = grp["passenger_demand"].rolling(window=24, min_periods=1).mean().reset_index(level=0,drop=True)
    df["lag_1"] = df["lag_1"].fillna(route_medians)
    df["lag_24"] = df["lag_24"].fillna(route_medians)

    # Target for prediction: next hour's demand
    df["target_next_hour"] = df.groupby("route")["passenger_demand"].shift(-1)

    # One-hot encode route
    df = pd.get_dummies(df, columns=["route"], prefix="route")

    # Baseline required trains
    if trains_df is not None and not trains_df.empty:
        avg_capacity = trains_df["capacity"].mean()
    else:
        avg_capacity = 250
    effective_capacity = avg_capacity * occupancy_target
    df["baseline_required_trains"] = np.ceil(df["passenger_demand"] / effective_capacity).astype(int)
    train_caps_sorted = sorted((trains_df["capacity"].tolist() if (trains_df is not None and not trains_df.empty) else [250,200,180]), reverse=True)
    def greedy_trains_needed(demand, sorted_caps=train_caps_sorted):
        req = 0
        sumcap = 0
        for c in sorted_caps:
            sumcap += c * occupancy_target
            req += 1
            if sumcap >= demand:
                return req
        return len(sorted_caps)
    df["greedy_min_trains"] = df["passenger_demand"].apply(lambda x: greedy_trains_needed(x))
    # Final columns
    feature_cols = [
        "timestamp", "date", "hour", "day_of_week", "is_weekend", "is_night", "event_size", "is_event_window",
        "passenger_demand", "lag_1", "lag_24", "rolling_3", "rolling_6", "rolling_24",
        "baseline_required_trains", "greedy_min_trains", "target_next_hour"
    ]
    route_cols = [c for c in df.columns if c.startswith("route_")]
    final_cols = feature_cols + route_cols
    final_df = df[final_cols].reset_index(drop=True)
    return final_df

# ---------------------------
# STEP 3: TRAIN/TEST SPLIT
# ---------------------------
def train_test_split_by_date(df, test_days=7):
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    last_date = df["timestamp"].dt.date.max()
    cutoff = pd.Timestamp(last_date) - pd.Timedelta(days=test_days)
    train = df[df["timestamp"] <= cutoff].reset_index(drop=True)
    test = df[df["timestamp"] > cutoff].reset_index(drop=True)
    return train, test

# ---------------------------
# STEP 4: PREDICTION MODEL
# ---------------------------
def train_and_save_model(train_df, model_path="passenger_forecast_model.pkl"):
    train_df = train_df.dropna(subset=["target_next_hour"])
    feature_cols = [c for c in train_df.columns if c not in ["timestamp", "date", "target_next_hour"]]
    X_train = train_df[feature_cols]
    y_train = train_df["target_next_hour"]
    
    model = XGBRegressor(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        random_state=CONFIG["seed"]
    )
    model.fit(X_train, y_train)
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    return model

# ---------------------------
# STEP 5: OPTIMIZATION
# ---------------------------
def get_schedule_recommendations(constraints_df, start_date, end_date):
    # This is a placeholder. The actual implementation should use the trained model
    # and optimization logic. For now, it returns a dummy schedule.
    print("Generating dummy schedule recommendations...")
    
    # Create a date range for the schedule
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Dummy data
    train_names = [f"Train {i}" for i in range(1, 4)]
    paths = ["Path A -> B", "Path B -> C", "Path C -> A"]
    times = ["08:00", "12:00", "16:00"]
    
    schedule_data = []
    for date in dates:
        for i in range(3):
            schedule_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "trainName": np.random.choice(train_names),
                "trainPath": np.random.choice(paths),
                "time": np.random.choice(times)
            })
            
    return pd.DataFrame(schedule_data)


# ---------------------------
# STEP 6: PIPELINE FUNCTION
# ---------------------------
def run_pipeline(new_data, model_path="passenger_forecast_model.pkl", train_capacity=250, num_trains=6):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Please train the model first.")
    
    model = joblib.load(model_path)
    forecast = model.predict(new_data)
    
    model_opt = cp_model.CpModel()
    trains_per_hour = [model_opt.NewIntVar(0, num_trains, f"trains_h{h}") for h in range(len(forecast))]
    
    for h in range(len(forecast)):
        required_trains = int(np.ceil(forecast[h] / train_capacity))
        model_opt.Add(trains_per_hour[h] >= required_trains)
        
    model_opt.Add(sum(trains_per_hour) <= num_trains * len(forecast))
    model_opt.Minimize(num_trains * len(forecast) - sum(trains_per_hour))
    
    solver = cp_model.CpSolver()
    status = solver.Solve(model_opt)
    
    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        schedule = [solver.Value(trains_per_hour[h]) for h in range(len(forecast))]
        return forecast, schedule
    else:
        return forecast, None

# Main execution block to run only when the script is executed directly
if __name__ == "__main__":
    print("--- Running rail_scheduler.py as a standalone script ---")
    
    # 1. Generate Data
    demand_df, events_df = generate_synthetic_demand(
        n_days=CONFIG["n_days"],
        time_freq=CONFIG["time_bucket"],
        routes=CONFIG["routes"],
        start_date=CONFIG["start_date"]
    )
    trains_df, _, _ = generate_train_driver_track_metadata(
        num_trains=CONFIG["num_trains"]
    )
    demand_df = inject_missingness(demand_df)
    print("Step 1: Synthetic data generated.")

    # 2. Preprocess Data
    processed_df = preprocess_demand(demand_df, events_df=events_df, occupancy_target=CONFIG["occupancy_target"], trains_df=trains_df)
    print("Step 2: Data preprocessed.")

    # 3. Split Data
    train_df, test_df = train_test_split_by_date(processed_df, test_days=7)
    print("Step 3: Data split into train/test sets.")

    # 4. Train and Save Model
    model = train_and_save_model(train_df)
    
    # Evaluate model
    test_df = test_df.dropna(subset=["target_next_hour"])
    feature_cols = [c for c in test_df.columns if c not in ["timestamp", "date", "target_next_hour"]]
    X_test = test_df[feature_cols]
    y_test = test_df["target_next_hour"]
    y_pred = model.predict(X_test)
    print("\nModel Evaluation on Test Set:")
    print("RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))
    print("R²:", r2_score(y_test, y_pred))

    # 5. Run Pipeline Example
    print("\nStep 5: Running optimization pipeline on a sample of test data...")
    forecast, schedule = run_pipeline(X_test.iloc[:24], train_capacity=trains_df["capacity"].mean())
    print("\nForecasted Demand (first 24 hours):", forecast)
    print("Optimized Train Schedule (first 24 hours):", schedule)