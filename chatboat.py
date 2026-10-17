"""Module 3 — Farmer Chatbot Route & Controller."""

from flask import Blueprint, render_template, request, jsonify
from services.chatbot_service import get_chatbot_response

chatbot_bp = Blueprint("chatbot", __name__)

@chatbot_bp.route("/chatbot")
def chatbot_view():
    return render_template("chatbot.html")

@chatbot_bp.route("/api/chatbot/message", methods=["POST"])
def send_message():
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    history = data.get("history", [])

    response_data = get_chatbot_response(message, history=history)
    return jsonify({
        "status": "success",
        "reply": response_data["reply"],
        "intent": response_data.get("intent", "general"),
        "confidence": response_data.get("confidence", 0.9)
    })
