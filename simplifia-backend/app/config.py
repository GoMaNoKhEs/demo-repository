# app/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

class Settings:
    # --- Google Cloud ---
    PROJECT_ID = os.getenv("PROJECT_ID", "simplifia-hackathon")
    REGION = os.getenv("REGION", "europe-west1")

    # --- Data base---
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "simplifia-db")
    DB_HOST = os.getenv("DB_HOST", "")
    DB_PORT = os.getenv("DB_PORT", "")

    # --- Flask ---
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-key") #sensitive user informations (ex: cookie) are signed with this secret key
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # --- Connexion SQLAlchemy ---
    DATABASE_URL = (
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
# Create a single instance of Settings to use across the app
settings = Settings()