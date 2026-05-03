import os
import pickle
import threading
from typing import Dict, Any, List

MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "ml_models",
)
os.makedirs(MODELS_DIR, exist_ok=True)

KNOWN_THRESHOLDS: Dict[str, float] = {
}

CATEGORY_ALIASES: Dict[str, str] = {
}

FULL_FILENAME_STEMS: set = set()

ALL_MVTEC_CATEGORIES = [
    "bottle", "cable", "capsule", "carpet", "grid",
    "hazelnut", "leather", "metal_nut", "pill", "screw",
    "tile", "toothbrush", "transistor", "wood", "zipper",
]


class ModelLoader:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelLoader, cls).__new__(cls)
                cls._instance._cache: Dict[str, Any] = {}
                cls._instance._cache_lock = threading.Lock()
            return cls._instance

    def _resolve_category(self, category: str) -> str:
        return CATEGORY_ALIASES.get(category, category)

    def _get_model_path(self, category: str) -> str:
        resolved = self._resolve_category(category)
        if resolved in FULL_FILENAME_STEMS:
            return os.path.join(MODELS_DIR, f"{resolved}.pkl")
        return os.path.join(MODELS_DIR, f"{resolved}_patchcore.pkl")

    def is_model_available(self, category: str) -> bool:
        return os.path.exists(self._get_model_path(category))

    def get_available_categories(self) -> List[str]:
        files = os.listdir(MODELS_DIR)
        found_stems = {
            f.replace("_patchcore.pkl", "")
            for f in files
            if f.endswith("_patchcore.pkl")
        }
        for stem in FULL_FILENAME_STEMS:
            if os.path.exists(os.path.join(MODELS_DIR, f"{stem}.pkl")):
                found_stems.add(stem)
        valid_cats = list(found_stems)
        for alias, target in CATEGORY_ALIASES.items():
            if target in found_stems and alias not in valid_cats:
                valid_cats.append(alias)
        return sorted(valid_cats)

    def get_model(self, category: str) -> Dict[str, Any]:
        resolved = self._resolve_category(category)
        if not self.is_model_available(category):
            raise FileNotFoundError(f"Model not trained for category: {category}")

        with self._cache_lock:
            if resolved not in self._cache:
                model_path = self._get_model_path(category)
                with open(model_path, "rb") as f:
                    self._cache[resolved] = pickle.load(f)
            model_data = dict(self._cache[resolved])  # shallow copy

        if category in KNOWN_THRESHOLDS:
            model_data["threshold"] = KNOWN_THRESHOLDS[category]
        elif resolved in KNOWN_THRESHOLDS:
            model_data["threshold"] = KNOWN_THRESHOLDS[resolved]

        return model_data

    def get_threshold(self, category: str) -> float:
        if category in KNOWN_THRESHOLDS:
            return KNOWN_THRESHOLDS[category]
        resolved = self._resolve_category(category)
        if resolved in KNOWN_THRESHOLDS:
            return KNOWN_THRESHOLDS[resolved]
        try:
            with self._cache_lock:
                cached = self._cache.get(resolved)
            if cached is not None:
                return float(cached.get("threshold", 1.0))
            model_path = self._get_model_path(category)
            with open(model_path, "rb") as f:
                data = pickle.load(f)
            return float(data.get("threshold", 1.0))
        except Exception:
            return 1.0

    def update_threshold(self, category: str, threshold: float) -> None:
        resolved = self._resolve_category(category)
        KNOWN_THRESHOLDS[category] = round(threshold, 6)
        KNOWN_THRESHOLDS[resolved] = round(threshold, 6)
        with self._cache_lock:
            self._cache.pop(resolved, None)

    def get_model_info(self, category: str) -> Dict[str, Any]:
        model_path = self._get_model_path(category)
        if not os.path.exists(model_path):
            return {
                "category":      category,
                "is_trained":    False,
                "i_auroc":       None,
                "p_auroc":       None,
                "threshold":     self.get_threshold(category),
                "model_size_mb": 0.0,
            }
        file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        try:
            model = self.get_model(category)
            config = model.get("config", {})
            i_auroc = config.get("i_auroc", None)
            p_auroc = config.get("p_auroc", None)
        except Exception:
            i_auroc, p_auroc = None, None

        return {
            "category":      category,
            "is_trained":    True,
            "i_auroc":       i_auroc,
            "p_auroc":       p_auroc,
            "threshold":     self.get_threshold(category),
            "model_path":    model_path,
            "model_size_mb": round(file_size_mb, 2),
        }


model_loader = ModelLoader()
