"""Module 4 — Farmer Market Connect Route & Controller."""

from flask import Blueprint, render_template, request, jsonify
from services.market_service import (
    get_all_listings,
    add_listing,
    get_mandi_benchmarks,
    place_order,
    get_orders
)

market_bp = Blueprint("market", __name__)

@market_bp.route("/market-connect")
def market_view():
    return render_template("market.html", listings=get_all_listings(), benchmarks=get_mandi_benchmarks(), orders=get_orders())

@market_bp.route("/api/market/listings", methods=["GET"])
def api_listings():
    return jsonify({"status": "success", "listings": get_all_listings()})

@market_bp.route("/api/market/add-listing", methods=["POST"])
def api_add_listing():
    data = request.get_json(silent=True) or {}
    new_item = add_listing(data)
    return jsonify({"status": "success", "listing": new_item})

@market_bp.route("/api/market/order", methods=["POST"])
def api_order():
    data = request.get_json(silent=True) or {}
    order = place_order(data)
    return jsonify({"status": "success", "order": order})
