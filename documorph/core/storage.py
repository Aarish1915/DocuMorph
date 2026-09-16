"""
DocuMorph Production Storage Engine.
Provides an abstract StorageBackend interface with support for:
1. Cloudflare R2 (S3-compatible, zero egress cost)
2. LocalStorageBackend (graceful fallback for local dev and CI/CD testing)
"""

import os
import io
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

logger = logging.getLogger("documorph.storage")


class StorageBackend(ABC):
    """Abstract storage interface for file uploads, downloads, and presigned links."""

    @abstractmethod
    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload raw bytes to storage key. Returns key or access URL."""
        pass

    @abstractmethod
    def download(self, key: str) -> bytes:
        """Download raw bytes from storage key."""
        pass

    @abstractmethod
    def get_url(self, key: str, expires_in: int = 3600) -> str:
        """Get an accessible URL (presigned or local endpoint) for the key."""
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        """Delete object at key. Returns True if successful."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if object exists in storage."""
        pass


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage provider for offline, testing, and fallback environments."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = Path(base_dir or "data").resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Initialized LocalStorageBackend at {self.base_dir}")

    def _resolve_path(self, key: str) -> Path:
        # Normalize key to prevent path traversal
        clean_key = key.lstrip("/\\")
        target = (self.base_dir / clean_key).resolve()
        if not str(target).startswith(str(self.base_dir)):
            raise ValueError(f"Security: Path traversal detected for key '{key}'")
        return target

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        path = self._resolve_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        logger.debug(f"LocalStorage uploaded {len(data)} bytes to {path}")
        return str(path)

    def download(self, key: str) -> bytes:
        path = self._resolve_path(key)
        if not path.is_file():
            raise FileNotFoundError(f"Storage key '{key}' does not exist locally at {path}")
        return path.read_bytes()

    def get_url(self, key: str, expires_in: int = 3600) -> str:
        path = self._resolve_path(key)
        return f"/api/download_local/{key.lstrip('/')}"

    def delete(self, key: str) -> bool:
        path = self._resolve_path(key)
        if path.is_file():
            path.unlink()
            return True
        return False

    def exists(self, key: str) -> bool:
        path = self._resolve_path(key)
        return path.is_file()


class CloudflareR2StorageBackend(StorageBackend):
    """Production Cloudflare R2 object storage provider with zero egress bandwidth charges."""

    def __init__(
        self,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket_name: str,
        public_url: Optional[str] = None
    ):
        try:
            import boto3
            from botocore.config import Config
        except ImportError:
            raise ImportError("boto3 is required for Cloudflare R2 storage. Install via: pip install boto3")

        self.bucket_name = bucket_name
        self.public_url = public_url.rstrip("/") if public_url else None
        endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name="auto",
            config=Config(signature_version="s3v4")
        )
        logger.info(f"Initialized CloudflareR2StorageBackend on bucket: {self.bucket_name}")

    def upload(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        clean_key = key.lstrip("/")
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=clean_key,
            Body=data,
            ContentType=content_type
        )
        logger.debug(f"R2 uploaded {len(data)} bytes to {clean_key}")
        if self.public_url:
            return f"{self.public_url}/{clean_key}"
        return clean_key

    def download(self, key: str) -> bytes:
        clean_key = key.lstrip("/")
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=clean_key)
            return response["Body"].read()
        except Exception as e:
            raise FileNotFoundError(f"R2 key '{clean_key}' could not be downloaded: {e}")

    def get_url(self, key: str, expires_in: int = 3600) -> str:
        clean_key = key.lstrip("/")
        if self.public_url:
            return f"{self.public_url}/{clean_key}"
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": clean_key},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            logger.warning(f"Presigned URL generation failed, returning key: {e}")
            return clean_key

    def delete(self, key: str) -> bool:
        clean_key = key.lstrip("/")
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=clean_key)
            return True
        except Exception as e:
            logger.warning(f"R2 delete failed for key '{clean_key}': {e}")
            return False

    def exists(self, key: str) -> bool:
        clean_key = key.lstrip("/")
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=clean_key)
            return True
        except Exception:
            return False


# Global Storage Singleton / Factory
_storage_instance: Optional[StorageBackend] = None


def get_storage() -> StorageBackend:
    """
    Factory function: returns Cloudflare R2 backend if environment credentials exist,
    otherwise gracefully falls back to LocalStorageBackend.
    """
    global _storage_instance
    if _storage_instance is not None:
        return _storage_instance

    account_id = os.getenv("R2_ACCOUNT_ID")
    access_key = os.getenv("R2_ACCESS_KEY_ID")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
    bucket = os.getenv("R2_BUCKET_NAME", "documorph-storage")
    public_url = os.getenv("R2_PUBLIC_URL")

    if account_id and access_key and secret_key:
        try:
            _storage_instance = CloudflareR2StorageBackend(
                account_id=account_id,
                access_key_id=access_key,
                secret_access_key=secret_key,
                bucket_name=bucket,
                public_url=public_url
            )
            return _storage_instance
        except Exception as e:
            logger.warning(f"Failed to initialize R2 storage, falling back to local: {e}")

    _storage_instance = LocalStorageBackend()
    return _storage_instance
