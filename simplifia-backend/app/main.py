# app/main.py
from flask import Flask, jsonify
from flask_cors import CORS

# Import the analyze blueprint
from app.api.v1.analyze import analyze_bp

def create_app():
    """
    Factory function to create and configure the Flask app.
    """
    app = Flask(__name__)
    CORS(app)  # Enable Cross-Origin Resource Sharing (for frontend)

    # Register blueprints
    app.register_blueprint(analyze_bp)

    # Health check route (optional but useful for debugging)
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "message": "SimplifIA backend is running"}), 200

    return app

# Entry point
if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=8080, debug=True)