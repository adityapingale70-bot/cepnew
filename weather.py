"""Module 5 — Crop Advisory & Weather Route & Controller."""

from flask import Blueprint, render_template, request, jsonify
from services.advisory_service import (
    get_crop_advisory,
    calculate_irrigation,
    get_weather_forecast,
    get_seasonal_tips
)

advisory_bp = Blueprint("advisory", __name__)

@advisory_bp.route("/advisory-weather")
def advisory_view():
    return render_template("advisory.html", weather=get_weather_forecast(), advisory=get_crop_advisory("Wheat"), tips=get_seasonal_tips())

@advisory_bp.route("/api/advisory/irrigation-calculate", methods=["POST"])
def api_irrigation():
    data = request.get_json(silent=True) or {}
    return jsonify({"status": "success", "result": calculate_irrigation(data)})
