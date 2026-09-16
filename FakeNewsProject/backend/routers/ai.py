import asyncio
import json
import os

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()

EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")
BASE_URL = os.getenv("EMERGENT_LLM_BASE", "https://api.emergent.sh/v1").rstrip("/")
MODEL = os.getenv("EMERGENT_LLM_MODEL", "gpt-5.4")

SYSTEM_PROMPT = (
    "You are the AI analyst inside Signal Desk, a research tool that separates textual "
    "similarity from factual truth. Analyze the provided article(s). Discuss: (1) writing "
    "style and sensational cues, (2) verifiable vs unverifiable claims, (3) overlap between "
    "the two articles if both are given and whether shared language implies copying or a "
    "shared source, (4) what a human fact-checker should do next. Be precise, neutral, and "
    "concise. Use short markdown sections."
)


def _build_messages(payload: dict) -> list:
    text = payload.get("text", "")
    compare = payload.get("compare")
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    if compare:
        msgs.append({
            "role": "user",
            "content": (
                "Article A (" + compare.get("title_a", "A") + "):\n" + compare.get("text_a", "") +
                "\n\nArticle B (" + compare.get("title_b", "B") + "):\n" + compare.get("text_b", "")
            ),
        })
    else:
        user = "Article" + (" (" + payload.get("title", "") + ")" if payload.get("title") else "") + ":\n" + text
        if payload.get("analysis"):
            user += "\n\nPipeline results (JSON):\n" + json.dumps(payload["analysis"])
        msgs.append({"role": "user", "content": user})
    return msgs


def _fallback_stream(payload: dict):
    lines = [
        "### Signal Desk - Local Analyst (no LLM key configured)\n\n",
        "The GPT-5.4 analyst streams real responses only when `EMERGENT_LLM_KEY` is set in `backend/.env`.\n\n",
        "Meanwhile, here is a structural read of the input:\n\n",
        "**Pipeline summary**\n",
    ]
    analysis = payload.get("analysis") or {}
    if analysis:
        for key, value in analysis.items():
            lines.append("- **" + str(key) + "**: " + json.dumps(value)[:300] + "\n")
    else:
        words = len((payload.get("text") or "").split())
        lines.append("- Word count: " + str(words) + "\n")
        lines.append("- Tip: add a labelled CSV at `data/raw/dataset.csv` to replace the mocked classifier.\n")
    lines.append("\n**Suggested next steps**\n- Cross-check named entities against primary sources.\n- Treat high similarity as overlap signal, never as a truth signal.\n")
    return lines


@router.post("/ai/analysis/stream")
async def stream_analysis(payload: dict):
    async def gen():
        key = EMERGENT_LLM_KEY
        if key and key != "YOUR_LLM_KEY_HERE":
            try:
                async with httpx.AsyncClient(timeout=90) as client:
                    async with client.stream(
                        "POST",
                        BASE_URL + "/chat/completions",
                        headers={
                            "Authorization": "Bearer " + key,
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": MODEL,
                            "messages": _build_messages(payload),
                            "stream": True,
                        },
                    ) as resp:
                        async for line in resp.aiter_lines():
                            if not line.startswith("data:"):
                                continue
                            data = line[5:].strip()
                            if data == "[DONE]":
                                break
                            try:
                                delta = json.loads(data)["choices"][0]["delta"].get("content", "")
                            except Exception:
                                delta = ""
                            if delta:
                                yield "data: " + json.dumps({"delta": delta}) + "\n\n"
                yield "data: [DONE]\n\n"
                return
            except Exception:
                pass  # fall through to local fallback
        for chunk in _fallback_stream(payload):
            yield "data: " + json.dumps({"delta": chunk}) + "\n\n"
            await asyncio.sleep(0.005)
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")
