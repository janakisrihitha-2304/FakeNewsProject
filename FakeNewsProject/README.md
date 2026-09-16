# Signal Desk — Fake News Detection & Similarity Analysis

A local VS Code version of the Emergent 'Signal Desk' app.

## Structure

FakeNewsProject/
  backend/   FastAPI API (algorithms/, ml/, routers/, lib/, models/)
  frontend/  Vite + React + TypeScript dashboard
  data/raw/  put your labelled dataset.csv here to un-mock the classifier

## Setup

### Backend (terminal 1)
    cd backend
    python -m venv .venv && source .venv/bin/activate   # optional but recommended
    pip install -r requirements.txt
    copy .env.example .env    # Windows:  copy .env.example .env
    # edit .env and set EMERGENT_LLM_KEY to your real key
    uvicorn server:app --host 0.0.0.0 --port 8001 --reload

### Frontend (terminal 2)
    cd frontend
    yarn install    # or: npm install
    yarn dev        # or: npm run dev

Open http://localhost:3000 — the API runs at http://localhost:8001/api/

## Notes

- No MongoDB? The backend automatically falls back to in-memory storage.
- The classifier is MOCKED until you add data/raw/dataset.csv (then also
  uncomment scikit-learn + pandas in requirements.txt).
- Never commit backend/.env — it holds your secret key.
