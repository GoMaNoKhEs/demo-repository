from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,     # Check if the connection is alive before using it
)

# Define the base class for all ORM models
Base = declarative_base()

# Create a factory for database sessions (each request uses a new session)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize all database tables (if they don't exist)
def init_db():
    from app.models.user import User
    from app.models.session import Session
    from app.models.task import Task
    from app.models.task_log import TaskLog
    Base.metadata.create_all(bind=engine)