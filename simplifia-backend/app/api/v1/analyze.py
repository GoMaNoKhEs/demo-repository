# app/api/v1/analyze.py
from flask import Blueprint, request, jsonify
from app.services.agent_core import analyze_user_request

analyze_bp = Blueprint("analyze", __name__)

@analyze_bp.route("/api/v1/analyze", methods=["POST"])
def analyze_text():
    """
    Receive user request, call Ai and return the response
    """
    try:
        data = request.get_json()
        if not data or "input_text" not in data:
            return jsonify({"error": "Missing 'input_text'"}), 400

        input_text = data["input_text"]

        # analyze
        result = analyze_user_request(input_text)

        return jsonify({"analysis": result}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500