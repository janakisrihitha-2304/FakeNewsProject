# Signal Desk — Specification

- Backend: FastAPI on :8001, routers for predict / compare / keywords / history / reports / ai stream.
- Similarity: TF-IDF cosine. DSA: KMP, Trie, Rabin-Karp, rolling hash, LCS (DP).
- Frontend: Vite + React + TS on :3000, dark Signal Desk theme.
- Classifier is MOCKED until data/raw/dataset.csv exists.
