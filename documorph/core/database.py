import os
import uuid
import datetime
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# We use a file-based SQLite database for our queue to ensure zero external dependencies (no Redis required on Windows)
# The timeout=30 parameter prevents 'database is locked' under moderate concurrency (up to ~15 users)
DB_PATH = "sqlite:///data/documorph_queue.db?timeout=30"

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})

from sqlalchemy import event

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

class PageResult(Base):
    __tablename__ = "page_results"

    id = Column(String, primary_key=True, default=lambda: f"page_{uuid.uuid4().hex[:8]}")
    job_id = Column(String, nullable=False, index=True)
    page_number = Column(Integer, nullable=False)
    raw_markdown = Column(String, nullable=True)
    status = Column(String, default="COMPLETED") # COMPLETED, FAILED
    error_msg = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SpamCorpusEntity(Base):
    """
    Learned spam/watermark knowledge base entity.
    Stores accumulated promotional patterns across user uploads for self-evolving filtering.
    """
    __tablename__ = "spam_corpus"

    id = Column(String, primary_key=True, default=lambda: f"spam_{uuid.uuid4().hex[:8]}")
    pattern_type = Column(String, nullable=False) # e.g., 'watermark_text', 'telegram', 'phone', 'promo_banner'
    pattern_value = Column(String, nullable=False, unique=True, index=True)
    occurrence_count = Column(Integer, default=1)
    source_document = Column(String, nullable=True)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:8]}")
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=True)
    status = Column(String, default="QUEUED") # QUEUED, PROCESSING, COMPLETED, FAILED
    progress_pct = Column(Integer, default=0)
    progress_msg = Column(String, default="Waiting in queue...")
    result_url = Column(String, nullable=True)
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
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

from sqlalchemy import text

def init_db():
    Base.metadata.create_all(bind=engine)
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
        ]:
            try:
                conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                # Column already exists
                pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
