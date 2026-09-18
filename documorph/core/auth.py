"""
DocuMorph Cryptographic Authentication Engine.
Implements bcrypt password hashing, constant-time verification,
and signed HMAC-SHA256 JWT access tokens for owner/admin portal.
"""

import os
import secrets
import datetime
import logging
from typing import Optional, Dict, Any
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("documorph.auth")

# JWT Configuration
JWT_SECRET = os.getenv("ADMIN_JWT_SECRET") or secrets.token_hex(32)
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 8

# Default Owner Credentials (can be overridden via environment variables)
DEFAULT_ADMIN_USER = os.getenv("ADMIN_USERNAME", "admin")
# Pre-hashed default password for initial bootstrap (password: 'CU24260243@documorph')
_raw_default_pwd = os.getenv("ADMIN_PASSWORD", "CU24260243@documorph")
DEFAULT_HASH = os.getenv("ADMIN_PASSWORD_HASH") or bcrypt.hashpw(_raw_default_pwd.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")

security = HTTPBearer(auto_error=False)


def hash_password(plain_password: str) -> str:
    """Hashes a password using bcrypt with 12 work rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Creates a cryptographically signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (expires_delta or datetime.timedelta(hours=JWT_EXPIRATION_HOURS))
    to_encode.update({"exp": expire, "iat": datetime.datetime.now(datetime.timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a signed JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """FastAPI dependency to guard admin endpoints."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for admin access",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    if payload.get("role") not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for administrative hub"
        )
    return payload
