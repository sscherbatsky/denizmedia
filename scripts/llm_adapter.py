"""Simple adapter that forwards our expected /generate POST to a text-generation-webui instance
and normalizes its response to {"reply": "..."} so `src/lib/ai/local.ts` works.

Usage:
  python -m venv .venv
  source .venv/bin/activate
  pip install fastapi httpx uvicorn
  uvicorn scripts.llm_adapter:app --host 127.0.0.1 --port 8000

Set `TEXT_WEBUI_API` env var if your webui API is running on a different URL.
"""
from typing import Any
import os
from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI()
WEBUI_API = os.getenv("TEXT_WEBUI_API", "http://127.0.0.1:7860/api/v1/generate")


@app.post("/generate")
async def generate(payload: dict[str, Any]):
    prompt = payload.get("prompt") or payload.get("text")
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt required")

    body = {"prompt": prompt}
    # pass-through options if provided
    for k in ("max_new_tokens", "temperature", "top_k", "top_p"): 
        if k in payload:
            body[k] = payload[k]

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(WEBUI_API, json=body)
            r.raise_for_status()
            j = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"upstream error: {e}")

    # text-generation-webui v1 returns { results: [{ generated_text: "..." }] }
    reply = None
    if isinstance(j, dict) and j.get("results") and isinstance(j["results"], list):
        reply = j["results"][0].get("generated_text")
    elif isinstance(j, dict) and j.get("generated_text"):
        reply = j.get("generated_text")
    elif isinstance(j, str):
        reply = j

    if not reply:
        raise HTTPException(status_code=502, detail="no reply from upstream")

    return {"reply": reply}
