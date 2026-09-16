import os
import uuid
import datetime
import logging
from typing import Optional
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    Text,
    DateTime,
    event,
    text
)
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("documorph.database")

# Ensure local data directory exists for SQLite fallback
os.makedirs("data", exist_ok=True)

# 1. Determine Database Engine: Neon Postgres in production, SQLite WAL in local/CI
DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("NEON")
    or os.getenv("neon")
    or os.getenv("NEON_DATABASE_URL")
    or os.getenv("NEON_URL")
)

if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip().strip("'").strip('"')
    # Normalize legacy Heroku/Render postgres:// scheme to postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    logger.info("Connecting to PostgreSQL database (Neon Serverless)...")
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"connect_timeout": 15}
    )
else:
    DB_PATH = "sqlite:///data/documorph_queue.db?timeout=30"
    logger.info("Using local SQLite database at data/documorph_queue.db")
    engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=30000")
            cursor.execute("PRAGMA synchronous=NORMAL")
        except Exception:
            pass
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def utc_now():
    """Timezone-aware UTC timestamp generator (Python 3.12+ compliant)."""
    return datetime.datetime.now(datetime.timezone.utc)


class PageResult(Base):
    __tablename__ = "page_results"

    id = Column(String, primary_key=True, default=lambda: f"page_{uuid.uuid4().hex[:8]}")
    job_id = Column(String, nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    raw_markdown = Column(String, nullable=True)
    markdown_key = Column(String, nullable=True)  # R2 / Storage key
    status = Column(String, default="COMPLETED")  # COMPLETED, FAILED
    error_msg = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class PageResultVersion(Base):
    """
    Audit trail and version control for reprocessed pages.
    Preserves original, regenerated markdown, prompt configuration, and diffs.
    """
    __tablename__ = "page_result_versions"

    id = Column(String, primary_key=True, default=lambda: f"pv_{uuid.uuid4().hex[:8]}")
    job_id = Column(String, nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    version_number = Column(Integer, default=1)
    prompt_used = Column(Text, nullable=True)
    raw_markdown = Column(Text, nullable=True)
    diff_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class SpamCorpusEntity(Base):
    """
    Learned spam/watermark knowledge base entity.
    Stores accumulated promotional patterns across user uploads for self-evolving filtering.
    """
    __tablename__ = "spam_corpus"

    id = Column(String, primary_key=True, default=lambda: f"spam_{uuid.uuid4().hex[:8]}")
    pattern_type = Column(String, nullable=False)
    pattern_value = Column(String, nullable=False, unique=True, index=True)
    occurrence_count = Column(Integer, default=1)
    source_document = Column(String, nullable=True)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class AdminUser(Base):
    """
    Cryptographically authenticated admin accounts (owner-only).
    """
    __tablename__ = "admin_users"

    id = Column(String, primary_key=True, default=lambda: f"admin_{uuid.uuid4().hex[:8]}")
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="owner")
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class AuditLog(Base):
    """
    Central audit log for security, telemetry, and processing events.
    """
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=lambda: f"audit_{uuid.uuid4().hex[:8]}")
    event_type = Column(String, nullable=False)
    job_id = Column(String, nullable=True)
    session_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:8]}")
    file_path = Column(String, nullable=False)
    file_key = Column(String, nullable=True)     # R2 / Storage upload key
    file_hash = Column(String, nullable=True)
    status = Column(String, default="QUEUED")     # QUEUED, PROCESSING, COMPLETED, FAILED
    progress_pct = Column(Integer, default=0)
    progress_msg = Column(String, default="Waiting in queue...")
    result_url = Column(String, nullable=True)
    output_key = Column(String, nullable=True)   # R2 / Storage output key
    error_msg = Column(String, nullable=True)
    
    # Advanced Extraction Parameters
    service_type = Column(String, default="clean_format")
    config_options = Column(String, default="{}")
    output_format = Column(String, default="pdf")
    original_file_size = Column(Integer, nullable=True)
    compressed_file_size = Column(Integer, nullable=True)
    
    language_mode = Column(String, default="auto")
    spam_words = Column(String, default="")
    ignore_images = Column(String, default="")
    custom_api_key = Column(String, nullable=True)
    custom_prompt = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


def claim_next_job(db) -> Optional[Job]:
    """
    Atomically claims the next pending QUEUED or QUEUED_REPROCESS job.
    Uses PostgreSQL SELECT ... FOR UPDATE SKIP LOCKED if connected to Postgres,
    guaranteeing zero double-processing across concurrent workers,
    or atomic FIFO transaction for SQLite.
    """
    query = db.query(Job).filter(Job.status.in_(["QUEUED", "QUEUED_REPROCESS"])).order_by(Job.created_at.asc())
    is_sqlite = engine.dialect.name == "sqlite"
    
    if not is_sqlite:
        job = query.with_for_update(skip_locked=True).first()
    else:
        job = query.first()

    if job:
        job.status = "PROCESSING"
        job.progress_msg = "Initializing..."
        job.updated_at = utc_now()
        db.commit()
        db.refresh(job)
    return job


def init_db():
    """Initializes schema and runs safe migrations."""
    Base.metadata.create_all(bind=engine)
    
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            try:
                conn.execute(text("PRAGMA journal_mode=WAL;"))
                conn.execute(text("PRAGMA busy_timeout=30000;"))
                conn.commit()
            except Exception:
                pass
            # Automatic column migration for existing SQLite databases
            for col_name, col_type in [
                ("service_type", "VARCHAR DEFAULT 'clean_format'"),
                ("config_options", "TEXT DEFAULT '{}'"),
                ("output_format", "VARCHAR DEFAULT 'pdf'"),
                ("original_file_size", "INTEGER"),
                ("compressed_file_size", "INTEGER"),
                ("file_key", "VARCHAR"),
                ("output_key", "VARCHAR"),
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                except Exception:
                    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
