from fastapi import APIRouter
from algorithms import kmp_search, Trie, rabin_karp_search, RollingHash, lcs
from lib.db import insert_one, find, stats
from lib.dates import utc_now_iso
from ml.classifier import classifier
from ml.preprocessing import tokenize
from ml.similarity import tfidf_cosine, shared_keywords
from models.analysis import PredictRequest, CompareRequest, KeywordRequest, ReportRequest

router = APIRouter()


@router.get("/stats")
async def get_stats():
    return await stats()


@router.post("/predict")
async def predict(payload: PredictRequest):
    result = classifier.predict(payload.text)
    await insert_one("analyses", {
        "type": "predict",
        "title": payload.title or payload.text[:60],
        "excerpt": payload.text[:300],
        "result": result,
        "created_at": utc_now_iso(),
    })
    return {"ok": True, "result": result, "mocked": result.get("mocked", False)}


@router.post("/compare")
async def compare(payload: CompareRequest):
    tokens_a = tokenize(payload.text_a)
    tokens_b = tokenize(payload.text_b)

    similarity = round(tfidf_cosine(payload.text_a, payload.text_b), 4)
    keywords = shared_keywords(payload.text_a, payload.text_b)

    # KMP: exact keyword positions in text B
    kmp_matches = {kw: kmp_search(payload.text_b.lower(), kw) for kw in keywords}
    kmp_matches = {k: v for k, v in kmp_matches.items() if v}

    # Trie: prefix structure over article A vocabulary
    trie = Trie()
    for w in sorted(set(tokens_a)):
        trie.insert(w)
    trie_suggestions = {}
    for kw in keywords[:5]:
        pref = kw[:3]
        trie_suggestions[kw] = trie.autocomplete(pref, limit=6)

    # Rabin-Karp: hash-verified exact phrase matches (3-grams of A found in B)
    grams = [" ".join(tokens_a[i:i + 3]) for i in range(0, max(0, len(tokens_a) - 2), 3)][:12]
    rk_matches = []
    for g in grams:
        pos = rabin_karp_search(payload.text_b.lower(), g)
        if pos:
            rk_matches.append({"phrase": g, "positions": pos[:5]})

    # Rolling hash: window fingerprint overlap
    win = 16
    rh_a = RollingHash(payload.text_a, win)
    rh_b = RollingHash(payload.text_b, win)
    shared_hash = rh_b.verify(rh_a.hashes())

    # LCS over token streams
    lcs_result = lcs(tokens_a[:400], tokens_b[:400])

    result = {
        "similarity": similarity,
        "similarity_percent": round(similarity * 100, 1),
        "shared_keywords": keywords,
        "kmp": {"keywords": kmp_matches, "total_matches": sum(len(v) for v in kmp_matches.values())},
        "trie": {"vocab_size": len(set(tokens_a)), "suggestions": trie_suggestions},
        "rabin_karp": {"matches": rk_matches, "verified": len(rk_matches)},
        "rolling_hash": {"window": win, "fingerprints_a": len(rh_a.hashes()), "shared": len(shared_hash)},
        "lcs": {"length": lcs_result["length"], "sequence_preview": " ".join(lcs_result["sequence"][:40])},
    }
    await insert_one("analyses", {
        "type": "compare",
        "title": payload.title_a + " vs " + payload.title_b,
        "excerpt": payload.text_a[:200],
        "result": result,
        "created_at": utc_now_iso(),
    })
    return {"ok": True, "result": result}


@router.post("/keywords")
async def keyword_lab(payload: KeywordRequest):
    text = payload.text
    lower = text.lower()
    kw = payload.keyword.lower().strip()
    if not kw:
        return {"ok": False, "error": "keyword is required"}
    kmp_positions = kmp_search(lower, kw)
    rk_positions = rabin_karp_search(lower, kw)
    trie = Trie()
    for w in sorted(set(tokenize(text))):
        trie.insert(w)
    return {
        "ok": True,
        "result": {
            "keyword": kw,
            "kmp_positions": kmp_positions[:50],
            "kmp_count": len(kmp_positions),
            "rabin_karp_positions": rk_positions[:50],
            "rk_verified": len(rk_positions) == len(kmp_positions),
            "trie_autocomplete": trie.autocomplete(kw[:3], limit=10),
            "in_vocab": trie.search(kw),
        },
    }


@router.get("/history")
async def history():
    return {"ok": True, "items": await find("analyses", limit=100)}


@router.get("/reports")
async def reports():
    return {"ok": True, "items": await find("reports", limit=100)}


@router.post("/reports")
async def create_report(payload: ReportRequest):
    doc = await insert_one("reports", {
        "title": payload.title,
        "content": payload.content,
        "created_at": utc_now_iso(),
    })
    return {"ok": True, "report": doc}
