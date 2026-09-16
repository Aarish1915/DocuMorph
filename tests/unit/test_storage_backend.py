import pytest
import os
from pathlib import Path
from documorph.core.storage import LocalStorageBackend, get_storage, StorageBackend

def test_local_storage_crud(tmp_path):
    storage = LocalStorageBackend(base_dir=tmp_path)
    test_key = "uploads/job_test_123.pdf"
    test_data = b"%PDF-1.4 Mock PDF Content For Storage Test"
    
    # 1. Upload
    res = storage.upload(test_key, test_data, content_type="application/pdf")
    assert storage.exists(test_key) is True
    
    # 2. Download
    downloaded = storage.download(test_key)
    assert downloaded == test_data
    
    # 3. URL
    url = storage.get_url(test_key)
    assert "job_test_123.pdf" in url
    
    # 4. Delete
    deleted = storage.delete(test_key)
    assert deleted is True
    assert storage.exists(test_key) is False

def test_local_storage_path_traversal_protection(tmp_path):
    storage = LocalStorageBackend(base_dir=tmp_path)
    with pytest.raises(ValueError, match="Path traversal detected"):
        storage._resolve_path("../../etc/passwd")

def test_get_storage_fallback():
    # Without R2 env vars, get_storage must return a LocalStorageBackend
    storage = get_storage()
    assert isinstance(storage, StorageBackend)
    assert hasattr(storage, "upload")
    assert hasattr(storage, "download")
