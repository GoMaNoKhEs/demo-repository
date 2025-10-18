# init_db.py
"""
This script initializes the database on Cloud SQL.
It creates all the tables defined in your SQLAlchemy models.
Run this file once after deploying your backend or when setting up a new environment.
"""

from app.database import init_db

if __name__ == "__main__":
    print("Creating tables in Cloud SQL...")
    init_db()
    print("Tables created successfully!")