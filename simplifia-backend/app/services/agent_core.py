# app/services/agent_core.py
import vertexai
from vertexai.preview.generative_models import GenerativeModel
import os

# Load environment variables (default values for local testing)
PROJECT_ID = os.getenv("PROJECT_ID", "simplifia-hackathon")
REGION = os.getenv("REGION", "europe-west1")

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=REGION)

def analyze_user_request(user_input: str) -> str:
    """
    Analyzes the user's request using Gemini 2.5 Flash
    and returns a structured action plan.
    """
    try:
        # Load the Gemini model
        model = GenerativeModel("gemini-2.5-flash")

        # Build the system prompt
        prompt = f"""
        You are SimplifIA — an intelligent administrative assistant.
        Analyze the following user request and provide a clear,
        structured, and prioritized action plan.

        Request: {user_input}
        """

        # Call the model and generate a response
        response = model.generate_content(prompt)

        # Return the generated text
        return response.text.strip()

    except Exception as e:
        return f"Error during analysis: {str(e)}"