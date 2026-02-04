from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path(os.getenv("HYDRA_DATA_DIR", PROJECT_ROOT / "data"))
DB_PATH = Path(os.getenv("HYDRA_DB_PATH", DATA_DIR / "hydra.db"))
BLOB_DIR = Path(os.getenv("HYDRA_BLOB_DIR", DATA_DIR / "blob"))

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

INVOICE_MANAGER_THRESHOLD = float(os.getenv("INVOICE_MANAGER_THRESHOLD", "5000"))

# Test-friendly Celery behavior
CELERY_ALWAYS_EAGER = os.getenv("CELERY_ALWAYS_EAGER", "0") == "1"
