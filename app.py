"""Farm Connect — Smart Agricultural Platform.
Central Flask application registering all 5 module blueprints and auto-launching port 5050.
"""

import os
from pathlib import Path
import joblib
import numpy as np
from flask import Flask, render_template, request, jsonify

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
    static_url_path="/static"
)
app.secret_key = os.environ.get("SECRET_KEY", "farm-connect-secret-key-2026")

# Register Module Blueprints
from routes.dashboard import dashboard_bp
from routes.disease import disease_bp
from routes.chatbot import chatbot_bp
from routes.market import market_bp
from routes.advisory import advisory_bp

app.register_blueprint(dashboard_bp)
app.register_blueprint(disease_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(market_bp)
app.register_blueprint(advisory_bp)

# ML Tabular Models for Yield & Risk Estimation
def load_model(name):
    path = MODEL_DIR / name
    if path.exists():
        try:
            return joblib.load(path)
        except Exception as e:
            print(f"Warning: Could not load {name}: {e}")
            return None
    return None

yield_model = load_model("yield_model.joblib")
disease_model = load_model("disease_model.joblib")
weather_model = load_model("weather_model.joblib")
yield_encoder = load_model("yield_encoder.joblib")

CROPS = ["Rice", "Wheat", "Cotton", "Tomato", "Potato", "Soybean", "Onion", "Maize", "Grapes", "Banana"]
CROP_BASELINES = {
    "Rice": 3.2, "Wheat": 3.0, "Cotton": 1.8, "Tomato": 28.0, "Potato": 22.0,
    "Soybean": 1.7, "Onion": 18.0, "Maize": 4.5, "Grapes": 15.0, "Banana": 35.0
}

def number(data, key, default, low, high):
    try:
        value = float(data.get(key, default))
        return min(max(value, low), high)
    except (TypeError, ValueError):
        return default

@app.route("/")
def home():
    from routes.dashboard import get_current_farmer
    from services.market_service import get_all_listings, get_mandi_benchmarks, get_orders
    from services.advisory_service import get_crop_advisory, get_weather_forecast, get_seasonal_tips

    farmer = get_current_farmer()
    listings = get_all_listings()
    benchmarks = get_mandi_benchmarks()
    orders = get_orders()
    weather = get_weather_forecast()
    advisory = get_crop_advisory("Wheat")
    tips = get_seasonal_tips()

    return render_template(
        "index.html",
        farmer=farmer,
        listings=listings,
        benchmarks=benchmarks,
        orders=orders,
        weather=weather,
        advisory=advisory,
        tips=tips
    )

@app.route("/api/health")
def health():
    cnn_model_file = MODEL_DIR / "cnn_disease_model.json"
    return jsonify({
        "status": "ok",
        "cnn_disease_model_loaded": cnn_model_file.exists(),
        "yield_model_loaded": yield_model is not None,
        "disease_model_loaded": disease_model is not None,
        "weather_model_loaded": weather_model is not None,
        "modules": [
            "Module 1: Farmer Dashboard",
            "Module 2: AI Plant Disease Detection (CNN)",
            "Module 3: Farmer Chatbot",
            "Module 4: Farmer Market Connect",
            "Module 5: Crop Advisory and Weather"
        ]
    })

if __name__ == "__main__":
    import socket
    import threading
    import webbrowser

    def can_bind(p, host="0.0.0.0"):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((host, p))
                return True
            except OSError:
                return False

    port = int(os.environ.get("PORT", 5000))
    if not can_bind(port):
        fallback_port = 5050 if port == 5000 else port + 1
        print(f"Notice: Port {port} is occupied (macOS AirPlay often uses 5000).")
        print(f"Starting Farm Connect on fallback port http://127.0.0.1:{fallback_port} instead...")
        port = fallback_port

    url = f"http://127.0.0.1:{port}"
    print(f"🌱 Farm Connect running at: {url}")
    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    app.run(host="0.0.0.0", port=port, debug=False)
