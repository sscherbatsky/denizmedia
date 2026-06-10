"""Small embedding server using sentence-transformers. Exposes POST /embed with JSON {"text":"..."}
and returns {"embedding": [...]}. This is CPU-friendly (all-MiniLM-L6-v2) and works as a free local embedding provider.

Usage:
  python -m venv .venv
  source .venv/bin/activate
  pip install fastapi sentence-transformers uvicorn
  uvicorn scripts.embedding_server:app --host 127.0.0.1 --port 8001

Set `LOCAL_EMBEDDING_URL` env var to point to this server for the Next.js app.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

class Req(BaseModel):
    text: str

try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception as e:
    model = None


@app.post("/embed")
def embed(req: Req):
    if model is None:
        raise HTTPException(status_code=500, detail="embedding model not loaded")
    emb = model.encode([req.text])[0]
    return {"embedding": emb.tolist()}
