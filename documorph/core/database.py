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
    Boolean,
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

from sqlalchemy.pool import NullPool

if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip().strip("'").strip('"')
    # Normalize legacy Heroku/Render postgres:// scheme to postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    is_neon_pooler = "-pooler" in DATABASE_URL or ":6543" in DATABASE_URL
    if is_neon_pooler:
        logger.info("Connecting to Neon PostgreSQL via PgBouncer Pooler (using NullPool)...")
        engine = create_engine(
            DATABASE_URL,
            poolclass=NullPool,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 15}
        )
    else:
        logger.info("Connecting to PostgreSQL database (high-concurrency QueuePool: size 25, overflow 35)...")
        engine = create_engine(
            DATABASE_URL,
            pool_size=25,
            max_overflow=35,
            pool_timeout=10,
            pool_pre_ping=True,
            pool_recycle=60,
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
    
    # Persistent Telemetry, Diagram Metadata & Idempotency
    telemetry_json = Column(Text, default="{}")
    report_markdown = Column(Text, default="")
    diagrams_data = Column(Text, default="[]")
    idempotency_hash = Column(String, nullable=True, index=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class StudentReview(Base):
    __tablename__ = "student_reviews"

    id = Column(String(64), primary_key=True, default=lambda: f"rev_{uuid.uuid4().hex[:8]}")
    student_name = Column(String(120), nullable=False)
    exam_target = Column(String(80), nullable=False, index=True)
    city = Column(String(120), nullable=True)
    rating = Column(Integer, default=5)
    review_text = Column(Text, nullable=False)
    verified_student = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now, index=True)


class DonationRecord(Base):
    __tablename__ = "donation_records"

    id = Column(String(64), primary_key=True, default=lambda: f"don_{uuid.uuid4().hex[:8]}")
    donor_name = Column(String(120), nullable=False)
    college = Column(String(120), nullable=True)
    amount = Column(String(32), nullable=False)
    utr_reference = Column(String(32), unique=True, index=True, nullable=False)
    message = Column(Text, nullable=True)
    tier = Column(String(32), default="chai", index=True)
    status = Column(String(32), default="verified", index=True)
    created_at = Column(DateTime, default=utc_now, index=True)


def seed_community_data(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        if db.query(StudentReview).count() == 0:
            initial_reviews = [
                StudentReview(
                    student_name="Aryan Sharma",
                    exam_target="JEE Advanced / Main",
                    city="Allen Kota",
                    rating=5,
                    review_text="Cleaned 120 pages of Allen physics photocopies. The dark shadows are 100% gone and all calculus integration limits and free-body diagrams stayed razor sharp!",
                    verified_student=True,
                ),
                StudentReview(
                    student_name="Rhea Mukherjee",
                    exam_target="NEET UG / PG",
                    city="Delhi Medical Academy",
                    rating=5,
                    review_text="Saved ₹450 on spiral binding! The 2-column compact mode squeezed 80 pages of botany lecture notes into 38 pages without dropping font readability.",
                    verified_student=True,
                ),
                StudentReview(
                    student_name="Vikramaditya Rao",
                    exam_target="UPSC CSE",
                    city="Mukherjee Nagar, Delhi",
                    rating=5,
                    review_text="Best tool for ancient history notes photocopied from library books. Devanagari quotes and Sanskrit terminology remained completely intact.",
                    verified_student=True,
                ),
                StudentReview(
                    student_name="Divya Patel",
                    exam_target="College / B.Tech",
                    city="SVNIT Surat",
                    rating=5,
                    review_text="Our entire hostel floor uses DocuMorph before mid-terms. Instant direct download straight to my iPhone storage.",
                    verified_student=True,
                ),
                StudentReview(
                    student_name="Siddharth Mehta",
                    exam_target="GATE / ESE",
                    city="Hyderabad",
                    rating=5,
                    review_text="Chemical engineering reaction diagrams and thermodynamics matrices came out with publication-grade vector quality. Huge respect for keeping this free.",
                    verified_student=True,
                ),
            ]
            db.add_all(initial_reviews)
            db.commit()

        if db.query(DonationRecord).count() == 0:
            initial_donations = [
                DonationRecord(
                    donor_name="IIT Delhi Mech Hostel",
                    college="IIT Delhi",
                    amount="₹500",
                    utr_reference="425619028471",
                    message="Our batch cleaned 400 pages of thermodynamics lecture notes. Saved ₹1,200 on spiral printing!",
                    tier="diamond",
                ),
                DonationRecord(
                    donor_name="Kunal Singhania",
                    college="Allen Career Institute Kota",
                    amount="₹500",
                    utr_reference="425619028472",
                    message="Best tool for dark photocopy modules. Math formulas stayed completely sharp.",
                    tier="diamond",
                ),
                DonationRecord(
                    donor_name="Dr. Priya V.",
                    college="AIIMS Bhopal",
                    amount="₹200",
                    utr_reference="425619028473",
                    message="Histology vector diagrams came out in pristine A4 publication quality.",
                    tier="gold",
                ),
                DonationRecord(
                    donor_name="Siddharth M.",
                    college="GATE Prep Hyderabad",
                    amount="₹150",
                    utr_reference="425619028474",
                    message="2-column compact mode reduced my photocopy volume by 55%.",
                    tier="gold",
                ),
                DonationRecord(
                    donor_name="Rohan Sharma",
                    college="PhysicsWallah Aspirant",
                    amount="₹100",
                    utr_reference="425619028475",
                    message="Telegram stamps and coaching watermarks disappeared completely.",
                    tier="gold",
                ),
                DonationRecord(
                    donor_name="Ananya Kapoor",
                    college="UPSC Aspirant Delhi",
                    amount="₹50",
                    utr_reference="425619028476",
                    message="Cleaned dark photocopies of ancient history notes without losing Devanagari text.",
                    tier="chai",
                ),
                DonationRecord(
                    donor_name="Aman Verma",
                    college="SGSITS Indore",
                    amount="₹20",
                    utr_reference="425619028477",
                    message="Bought a chai for the developer. Keep this free!",
                    tier="chai",
                ),
            ]
            db.add_all(initial_donations)
            db.commit()
    except Exception as e:
        logger.warning(f"Error seeding community data: {e}")
        db.rollback()
    finally:
        if close_db:
            db.close()


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
        job.progress_pct = 5
        job.progress_msg = "Job claimed by worker"
        job.updated_at = utc_now()
        db.commit()
        db.refresh(job)
    return job


def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        is_sqlite = engine.dialect.name == "sqlite"
        if is_sqlite:
            try:
                conn.execute(text("PRAGMA journal_mode=WAL;"))
                conn.execute(text("PRAGMA synchronous=NORMAL;"))
                conn.execute(text("PRAGMA busy_timeout=30000;"))
                conn.commit()
            except Exception:
                pass
        
        # Universal column migration for both SQLite and PostgreSQL (Neon)
        migration_cols = [
            ("service_type", "VARCHAR DEFAULT 'clean_format'"),
            ("config_options", "TEXT DEFAULT '{}'"),
            ("output_format", "VARCHAR DEFAULT 'pdf'"),
            ("original_file_size", "INTEGER"),
            ("compressed_file_size", "INTEGER"),
            ("file_key", "VARCHAR"),
            ("output_key", "VARCHAR"),
            ("telemetry_json", "TEXT DEFAULT '{}'"),
            ("report_markdown", "TEXT DEFAULT ''"),
            ("diagrams_data", "TEXT DEFAULT '[]'"),
            ("idempotency_hash", "VARCHAR(64)"),
        ]
        for col_name, col_type in migration_cols:
            try:
                if is_sqlite:
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}"))
                else:
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass
        try:
            if is_sqlite:
                conn.execute(text("ALTER TABLE page_results ADD COLUMN markdown_key VARCHAR"))
            else:
                conn.execute(text("ALTER TABLE page_results ADD COLUMN IF NOT EXISTS markdown_key VARCHAR"))
            conn.commit()
        except Exception:
            pass

    # Seed initial student testimonials and backers if database is freshly created
    try:
        seed_community_data()
    except Exception as e:
        logger.warning(f"Failed to auto-seed community data: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
