import os
import random

SENSATIONAL = [
    "shocking", "miracle", "secret", "exposed", "banned", "cure", "hoax",
    "conspiracy", "alien", "illuminati", "urgent", "warning", "you wont believe",
    "doctors hate", "censored", "coverup", "fbi", "wake up", "sheep", "mainstream media",
]
CREDIBLE = [
    "according to", "study", "research", "report", "officials", "data", "survey",
    "university", "journal", "analysis", "confirmed", "statement", "spokesperson",
]


class FakeNewsClassifier:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self._try_load_dataset()

    def _try_load_dataset(self):
        csv_path = os.path.normpath(
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw", "dataset.csv")
        )
        if not os.path.exists(csv_path):
            return
        try:
            import pandas as pd
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression

            df = pd.read_csv(csv_path)
            text_col = next((c for c in df.columns if c.lower() in ("text", "content", "article")), None)
            label_col = next((c for c in df.columns if c.lower() in ("label", "target", "class")), None)
            if text_col is None or label_col is None:
                return
            df = df.dropna(subset=[text_col, label_col])
            labels = df[label_col].astype(str).str.lower()
            y = labels.isin(["fake", "false", "0", "f"]) | labels.str.contains("fake")
            if y.nunique() < 2 or len(df) < 50:
                return
            self.vectorizer = TfidfVectorizer(stop_words="english", max_features=10000)
            X = self.vectorizer.fit_transform(df[text_col].astype(str))
            self.model = LogisticRegression(max_iter=1000)
            self.model.fit(X, y.astype(int))
        except Exception:
            self.model = None
            self.vectorizer = None

    @property
    def mocked(self) -> bool:
        return self.model is None

    def predict(self, text: str) -> dict:
        if self.model is not None and self.vectorizer is not None:
            X = self.vectorizer.transform([text])
            proba = float(self.model.predict_proba(X)[0][1])
            return {
                "label": "FAKE" if proba >= 0.5 else "REAL",
                "confidence": round(proba if proba >= 0.5 else 1 - proba, 4),
                "fake_probability": round(proba, 4),
                "mocked": False,
                "note": "Trained on data/raw/dataset.csv",
            }
        return self._mock_predict(text)

    def _mock_predict(self, text: str) -> dict:
        lower = text.lower()
        s_hits = sum(1 for w in SENSATIONAL if w in lower)
        c_hits = sum(1 for w in CREDIBLE if w in lower)
        score = s_hits - c_hits
        words = len(lower.split())
        if words < 30:
            score += 1  # too short to verify -> treat as suspicious in demo mode
        fake_prob = min(0.95, max(0.05, 0.45 + 0.14 * score + random.uniform(-0.05, 0.05)))
        return {
            "label": "FAKE" if fake_prob >= 0.5 else "REAL",
            "confidence": round(fake_prob if fake_prob >= 0.5 else 1 - fake_prob, 4),
            "fake_probability": round(fake_prob, 4),
            "mocked": True,
            "signals": {"sensational_hits": s_hits, "credibility_hits": c_hits, "word_count": words},
            "note": "Demo heuristic only. Add a labelled CSV at data/raw/dataset.csv to train a real model.",
        }


classifier = FakeNewsClassifier()
