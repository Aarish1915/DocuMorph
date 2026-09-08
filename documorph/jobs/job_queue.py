import sqlite3
import os
import time
from pathlib import Path

DB_PATH = Path("data/db/queue.db")

class JobQueue:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path
        os.makedirs(self.db_path.parent, exist_ok=True)
        self._init_db()

    def _get_conn(self):
        # WAL mode is crucial for concurrent read/writes in SQLite
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute('pragma journal_mode=wal')
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_path TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL,
                    result_path TEXT,
                    error_message TEXT
                )
            ''')
            # Index for fast polling of PENDING jobs
            conn.execute('CREATE INDEX IF NOT EXISTS idx_status ON jobs(status)')

    def add_job(self, file_path: str) -> int:
        """Adds a new PDF processing job to the queue."""
        now = time.time()
        with self._get_conn() as conn:
            cursor = conn.execute('''
                INSERT INTO jobs (file_path, status, created_at, updated_at)
                VALUES (?, 'PENDING', ?, ?)
            ''', (file_path, now, now))
            return cursor.lastrowid

    def get_next_job(self):
        """Atomically gets the next PENDING job and marks it PROCESSING."""
        with self._get_conn() as conn:
            conn.execute('BEGIN EXCLUSIVE')
            cursor = conn.execute('''
                SELECT id, file_path FROM jobs 
                WHERE status = 'PENDING' 
                ORDER BY created_at ASC 
                LIMIT 1
            ''')
            row = cursor.fetchone()
            if row:
                job_id = row['id']
                now = time.time()
                conn.execute('''
                    UPDATE jobs 
                    SET status = 'PROCESSING', updated_at = ? 
                    WHERE id = ?
                ''', (now, job_id))
                return dict(row)
            return None

    def complete_job(self, job_id: int, result_path: str):
        now = time.time()
        with self._get_conn() as conn:
            conn.execute('''
                UPDATE jobs 
                SET status = 'COMPLETED', result_path = ?, updated_at = ? 
                WHERE id = ?
            ''', (result_path, now, job_id))

    def fail_job(self, job_id: int, error_message: str):
        now = time.time()
        with self._get_conn() as conn:
            conn.execute('''
                UPDATE jobs 
                SET status = 'FAILED', error_message = ?, updated_at = ? 
                WHERE id = ?
            ''', (error_message, now, job_id))
            
    def get_job_status(self, job_id: int):
        with self._get_conn() as conn:
            cursor = conn.execute('SELECT status, result_path, error_message FROM jobs WHERE id = ?', (job_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
