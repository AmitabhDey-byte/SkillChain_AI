import sys
import types
from pathlib import Path


service_root = Path(__file__).resolve().parent
repository_root = service_root.parent
if str(repository_root) not in sys.path:
    sys.path.insert(0, str(repository_root))
if "backend" not in sys.modules:
    backend_package = types.ModuleType("backend")
    backend_package.__path__ = [str(service_root)]
    sys.modules["backend"] = backend_package

from backend.app.main import app


__all__ = ["app"]
