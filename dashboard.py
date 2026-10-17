"""Module 1 — Farmer Dashboard Route & Controller."""

from flask import Blueprint, render_template, request, jsonify, session

dashboard_bp = Blueprint("dashboard", __name__)

DEFAULT_FARMER = {
    "name": "Rajendra Sharma",
    "phone": "+91 98765 43210",
    "state": "Maharashtra",
    "district": "Nashik",
    "village": "Niphad",
    "farm_size_acres": 6.5,
    "soil_type": "Black Clay Soil",
    "irrigation_source": "Drip Irrigation + Borewell",
    "primary_crop": "Wheat",
    "secondary_crop": "Tomato",
    "selected_crops": ["Wheat", "Tomato", "Onion"],
    "registered_date": "2024-03-15"
}

def get_current_farmer():
    if "farmer" not in session:
        session["farmer"] = DEFAULT_FARMER.copy()
    return session["farmer"]

@dashboard_bp.route("/dashboard")
def dashboard_view():
    farmer = get_current_farmer()
    return render_template("dashboard.html", farmer=farmer)

@dashboard_bp.route("/api/farmer/profile", methods=["GET", "POST"])
def farmer_profile():
    farmer = get_current_farmer()
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        for key in ["name", "phone", "state", "district", "village", "soil_type", "irrigation_source"]:
            if key in data:
                farmer[key] = str(data[key])
        try:
            if "farm_size_acres" in data:
                farmer["farm_size_acres"] = float(data["farm_size_acres"])
        except (ValueError, TypeError):
            pass
        session["farmer"] = farmer
        session.modified = True
        return jsonify({"success": True, "message": "Profile updated!", "farmer": farmer})
    return jsonify({"success": True, "farmer": farmer})
