# app/api/v1/analyze.py
from flask import Blueprint, request, jsonify
from google.cloud import aiplatform
import os

# Create a Flask Blueprint (mini-app)
analyze_bp = Blueprint("analyze", __name__)

# Load Google Cloud project info from environment
PROJECT_ID = os.getenv("PROJECT_ID", "simplifia-hackathon")
REGION = os.getenv("REGION", "europe-west1")

# Initialize Vertex AI client
aiplatform.init(project=PROJECT_ID, location=REGION)


@analyze_bp.route("/api/v1/analyze", methods=["POST"])
def analyze_text():
    """
    This endpoint sends user text to the Gemini model for analysis.
    """

    data = request.get_json()
    if not data or "input_text" not in data:
        return jsonify({"error": "Missing 'input_text' in request body"}), 400

    input_text = data["input_text"]

    try:
        model = aiplatform.gapic.PredictionServiceClient()
        model_id = "projects/{}/locations/{}/publishers/google/models/gemini-1.5-flash".format(
            PROJECT_ID, REGION
        )
        instance = {"content": input_text} #the content we send to gemini
        instances = [instance]  #a list of content gemini will process 

        #Call the Vertex AI endpoint
        response = model.predict(
            endpoint=model_id,
            instances=instances,
        )

        #Extract and return result
        output = response.predictions[0]["content"]
        return jsonify({"analysis": output}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500