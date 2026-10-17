

import os
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__, template_folder=str(BASE_DIR), static_folder=str(BASE_DIR), static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "farm-connect-secret-key-2026")

# In-Memory State
FARMER_PROFILE = {
    "name": "Rajendra Sharma",
    "phone": "+91 98765 43210",
    "state": "Maharashtra",
    "district": "Nashik",
    "village": "Niphad",
    "farm_size_acres": 6.5,
    "soil_type": "Black Clay Soil",
    "irrigation_source": "Drip Irrigation + Borewell",
    "primary_crop": "Wheat",
    "selected_crops": ["Wheat", "Tomato", "Onion"]
}

MARKET_LISTINGS = [
    {"id": 1, "crop": "Tomato (Grade A)", "farmer": "Rajendra Sharma", "location": "Nashik", "quantity": 45, "price": 2350, "organic": True},
    {"id": 2, "crop": "Sharbati Wheat", "farmer": "Baldev Singh", "location": "Karnal", "quantity": 120, "price": 2650, "organic": False},
    {"id": 3, "crop": "Nashik Red Onion", "farmer": "Sunil Patil", "location": "Lasalgaon", "quantity": 80, "price": 2150, "organic": True}
]


@app.route("/")
@app.route("/dashboard")
@app.route("/disease-detection")
@app.route("/chatbot")
@app.route("/market-connect")
@app.route("/advisory-weather")
def serve_index():
    for candidate in ["index.html", "templates/index.html"]:
        p = BASE_DIR / candidate
        if p.exists():
            with open(p, "r", encoding="utf-8") as f:
                return f.read()
    return "<h1>🌱 Farm Connect is Live! Upload index.html to view the frontend.</h1>"

@app.route("/static/<path:filename>")
def serve_static(filename):
    for folder in [BASE_DIR, BASE_DIR / "static"]:
        target = folder / filename
        if target.exists():
            return send_from_directory(str(folder), filename)
    return send_from_directory(str(BASE_DIR), filename)


@app.route("/api/farmer/profile", methods=["GET", "POST"])
def farmer_profile():
    global FARMER_PROFILE
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        for key in ["name", "phone", "state", "district", "village", "soil_type", "irrigation_source"]:
            if key in data:
                FARMER_PROFILE[key] = str(data[key])
        if "farm_size_acres" in data:
            try:
                FARMER_PROFILE["farm_size_acres"] = float(data["farm_size_acres"])
            except (ValueError, TypeError):
                pass
        return jsonify({"status": "success", "message": "Profile updated!", "farmer": FARMER_PROFILE})
    return jsonify({"status": "success", "farmer": FARMER_PROFILE})


@app.route("/api/disease/analyze", methods=["POST"])
def analyze_disease():
    sample = request.form.get("sample") or (request.get_json(silent=True) or {}).get("sample", "tomato_early_blight")
    
    database = {
        "tomato_early_blight": {
            "disease_name": "Tomato Early Blight",
            "crop": "Tomato",
            "confidence": 0.968,
            "pathogen_type": "Fungal",
            "severity": "High",
            "symptoms": "Dark brown bullseye rings on mature lower leaves surrounded by yellow chlorotic halo.",
            "organic_treatments": ["Prune infected lower foliage immediately", "Spray Cold-Pressed Neem Oil (10,000 ppm) @ 3 ml/L"],
            "chemical_treatments": ["Foliar spray with Mancozeb 75% WP @ 2.5 g/L", "Azoxystrobin 23% SC @ 1 ml/L"]
        },
        "rice_blast": {
            "disease_name": "Rice Leaf Blast",
            "crop": "Rice",
            "confidence": 0.942,
            "pathogen_type": "Fungal",
            "severity": "High",
            "symptoms": "Spindle-shaped lesions with grayish centers and brownish-red borders on leaf blades.",
            "organic_treatments": ["Avoid excessive nitrogen fertilizers", "Spray Pseudomonas fluorescens @ 10 g/L"],
            "chemical_treatments": ["Spray Tricyclazole 75% WP @ 0.6 g/L water", "Isoprothiolane 40% EC @ 1.5 ml/L"]
        },
        "wheat_rust": {
            "disease_name": "Wheat Brown Rust",
            "crop": "Wheat",
            "confidence": 0.955,
            "pathogen_type": "Fungal",
            "severity": "Moderate",
            "symptoms": "Small oval bright orange-brown pustules scattering powdery spores on upper leaf.",
            "organic_treatments": ["Plant resistant seeds (HD-2967)", "Spray fermented sour buttermilk (1:10 dilution)"],
            "chemical_treatments": ["Spray Propiconazole 25% EC (Tilt) @ 1 ml/L water"]
        }
    }
    
    diag = database.get(sample, database["tomato_early_blight"])
    return jsonify({"status": "success", "diagnosis": diag})


@app.route("/api/chatbot/message", methods=["POST"])
def chatbot_message():
    data = request.get_json(silent=True) or {}
    q = str(data.get("message", "")).lower()
    
    if "fertilizer" in q or "npk" in q:
        reply = "For Tomato and vegetables: Apply 120 kg N, 60 kg P2O5, and 60 kg K2O per hectare. Split Nitrogen into 3 doses: basal, 30 days, and 60 days."
    elif "blast" in q:
        reply = "Rice Blast is controlled by seed treatment with Carbendazim 2g/kg seed followed by foliar application of Tricyclazole 75 WP @ 0.6 g/L water."
    elif "wheat" in q or "water" in q or "irrigation" in q:
        reply = "Wheat requires 4-6 irrigations at Crown Root Initiation (21 days), Tillering, Flowering, and Grain Filling stages."
    elif "jeevamrit" in q or "organic" in q:
        reply = "Mix 10 kg native cow dung, 10 L cow urine, 2 kg jaggery, and 2 kg pulse flour in 200 L water. Ferment for 48 hours for potent bio-fertilizer."
    else:
        reply = "Namaste! For optimal crop yield, maintain balanced NPK nutrition, test soil moisture before irrigating, and inspect underleaf surfaces weekly for pest eggs."
        
    return jsonify({"status": "success", "reply": reply})


@app.route("/api/market/listings", methods=["GET"])
def get_listings():
    return jsonify({"status": "success", "listings": MARKET_LISTINGS})

@app.route("/api/market/add-listing", methods=["POST"])
def add_listing():
    data = request.get_json(silent=True) or {}
    new_item = {
        "id": len(MARKET_LISTINGS) + 1,
        "crop": data.get("crop", "Harvest Crop"),
        "farmer": FARMER_PROFILE["name"],
        "location": FARMER_PROFILE["district"],
        "quantity": float(data.get("quantity", 50)),
        "price": float(data.get("price", 2200)),
        "organic": True
    }
    MARKET_LISTINGS.insert(0, new_item)
    return jsonify({"status": "success", "listing": new_item})

@app.route("/api/market/order", methods=["POST"])
def place_order():
    return jsonify({"status": "success", "message": "Trade order placed! Farmer notified via SMS."})


@app.route("/api/advisory/irrigation-calculate", methods=["POST"])
def irrigation_calculate():
    data = request.get_json(silent=True) or {}
    temp = float(data.get("temperature", 30))
    rain = float(data.get("rainfall", 0))
    soil = str(data.get("soil_type", "clay")).lower()
    
    hours = 24
    if temp > 33: hours -= 8
    if "sandy" in soil: hours -= 6
    if "clay" in soil: hours += 6
    if rain > 10: hours += 30
    hours = max(4, hours)
    
    return jsonify({
        "status": "success",
        "result": {
            "hours_until_next_irrigation": hours,
            "recommended_volume_liters_acre": 28000,
            "status": "Optimal"
        }
    })

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "app": "Farm Connect 5-in-1 Platform", "server": "live"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
