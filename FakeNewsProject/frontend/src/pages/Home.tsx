import { useEffect, useRef, useState } from "react";
import { api, streamAI } from "../lib/api";
import { useQuery } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input, Textarea } from "../components/ui/input";

type View = "overview" | "detect" | "compare" | "keywords" | "history" | "reports";

const NAV: { id: View; label: string; sub: string; icon: string }[] = [
  { id: "overview", label: "OVERVIEW", sub: "Workspace", icon: "M4 20V10m6 10V4m6 16v-7" },
  { id: "detect", label: "DETECT NEWS", sub: "Classification", icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" },
  { id: "compare", label: "COMPARE", sub: "Full analysis", icon: "M8 7h13m-13 5h13m-13 5h13M3 7h.01M3 12h.01M3 17h.01" },
  { id: "keywords", label: "KEYWORD LAB", sub: "KMP + Trie", icon: "M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" },
  { id: "history", label: "HISTORY", sub: "MongoDB log", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "reports", label: "REPORTS", sub: "Export center", icon: "M9 12h6m-6 4h6M9 8h6M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" },
];

const MODULES = [
  { name: "TF-IDF", what: "Cosine similarity", color: "#7c9aff" },
  { name: "KMP", what: "Exact keyword positions", color: "#4fd6a3" },
  { name: "TRIE", what: "Prefix patterns", color: "#f5d76e" },
  { name: "RABIN-KARP", what: "Hash verification", color: "#ff6b6b" },
  { name: "ROLLING HASH", what: "Window updates", color: "#7c9aff" },
  { name: "LCS + DP", what: "Common sequence", color: "#4fd6a3" },
];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const stats = useQuery(() => api.stats());
  const s: any = stats.data ?? {};

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-eyebrow">TRUTH / TEXT LAB</div>
        <div className="brand">Signal Desk<span className="dot">.</span></div>
        <div className="status-card">
          <div className="ok">ANALYSIS SERVER ONLINE</div>
          <div className="sub">LOCAL / {s.storage === "mongodb" ? "MONGO PERSISTENCE" : "MEMORY PERSISTENCE"}</div>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={"nav-item" + (view === n.id ? " active" : "")} onClick={() => setView(n.id)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={n.icon} />
            </svg>
            <span>
              {n.label}
              <span className="sub">{n.sub}</span>
            </span>
          </button>
        ))}
        <div className="foot">
          A research surface for separating article overlap from factual confidence.
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="crumb">/ WORKSPACE / <b>{view.toUpperCase()}</b></div>
            <div className="title">Fake News Detection &amp; Similarity Analysis</div>
          </div>
          <div className="badges">
            <Badge>MOCKED MODEL</Badge>
            <Badge live>LIVE WORKSPACE</Badge>
          </div>
        </div>

        {view === "overview" && <Overview analyses={s.analyses ?? 0} reports={s.reports ?? 0} go={setView} />}
        {view === "detect" && <Detect />}
        {view === "compare" && <Compare />}
        {view === "keywords" && <KeywordLab />}
        {view === "history" && <History />}
        {view === "reports" && <Reports />}
      </main>
    </div>
  );
}

/* ================= OVERVIEW ================= */

function Overview({ analyses, reports, go }: { analyses: number; reports: number; go: (v: View) => void }) {
  return (
    <div>
      <section className="hero">
        <div className="eyebrow">WORKSPACE / SIGNAL DESK</div>
        <h1>Separate similarity from truth.</h1>
        <p>
          A working analysis desk for fake-news experiments. Run an independent demo
          classification, then compare how two stories overlap without confusing shared
          language for factuality.
        </p>
        <div className="actions">
          <Button variant="primary" onClick={() => go("detect")}>ANALYZE ONE ARTICLE ↗</Button>
          <Button onClick={() => go("compare")}>COMPARE TWO ARTICLES ⚖</Button>
        </div>
      </section>

      <div className="grid cols-2">
        <Card label="SIMILARITY ENGINE" big="TF-IDF" bigClass="blue" desc="cosine vectors" />
        <Card label="DSA MODULES" big="05" bigClass="yellow" desc="KMP · Trie · hashes · LCS" />
        <Card label="SAVED ANALYSES" big={analyses} bigClass="green" desc="MongoDB history" />
        <Card label="REPORTS READY" big={reports} bigClass="red" desc="downloadable text" />
      </div>

      <div className="section-title">ANALYSIS MODULES</div>
      <div className="grid cols-3">
        {MODULES.map((m) => (
          <div className="module" key={m.name}>
            <div className="swatch" style={{ background: m.color }} />
            <div className="name">{m.name}</div>
            <div className="what">{m.what}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= DETECT ================= */

function Detect() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const aiRef = useRef("");

  async function run() {
    if (!text.trim()) return;
    setBusy(true);
    setResult(null);
    setAi("");
    try {
      const r = await api.predict({ title, text });
      setResult(r.result);
    } finally {
      setBusy(false);
    }
  }

  async function askAI() {
    setAi("");
    setAiBusy(true);
    aiRef.current = "";
    try {
      await streamAI({ title, text, analysis: result ?? undefined }, (d) => {
        aiRef.current += d;
        setAi(aiRef.current);
      });
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div>
      <div className="grid cols-2">
        <div className="card">
          <div className="label">INPUT</div>
          <span className="field-label">HEADLINE</span>
          <Input placeholder="Article headline…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <span className="field-label">ARTICLE TEXT</span>
          <Textarea
            placeholder="Paste the article body here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row" style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={run} disabled={busy || !text.trim()}>
              {busy ? "RUNNING…" : "RUN CLASSIFICATION"}
            </Button>
            {result && (
              <Button onClick={askAI} disabled={aiBusy}>
                {aiBusy ? "ANALYST STREAMING…" : "ASK AI ANALYST"}
              </Button>
            )}
          </div>
        </div>

        <div>
          {result ? (
            <div className="result-panel">
              <div className="label">CLASSIFICATION RESULT</div>
              <div className="verdict">
                <span className={"word " + (result.label === "FAKE" ? "fake" : "real")}>{result.label}</span>
                <span style={{ fontFamily: "var(--mono)", color: "var(--muted)" }}>
                  {Math.round(result.confidence * 100)}% confidence
                </span>
              </div>
              <div className="meter">
                <div style={{ width: Math.round(result.fake_probability * 100) + "%" }} />
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--faint)" }}>
                FAKE PROBABILITY {Math.round(result.fake_probability * 100)}%
              </div>
              {result.signals && (
                <div style={{ marginTop: 18 }}>
                  <div className="kv">
                    <span className="k">SENSATIONAL HITS</span><span className="v">{result.signals.sensational_hits}</span>
                    <span className="k">CREDIBILITY HITS</span><span className="v">{result.signals.credibility_hits}</span>
                    <span className="k">WORD COUNT</span><span className="v">{result.signals.word_count}</span>
                  </div>
                </div>
              )}
              <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.7, marginTop: 18 }}>{result.note}</p>
            </div>
          ) : (
            <div className="empty">RUN A CLASSIFICATION TO SEE THE VERDICT</div>
          )}
        </div>
      </div>

      {(ai || aiBusy) && (
        <div style={{ marginTop: 22 }}>
          <div className="section-title">AI ANALYST — STREAMED</div>
          <div className="ai-stream">
            {ai}
            {aiBusy && <span className="ai-cursor" />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= COMPARE ================= */

function Compare() {
  const [a, setA] = useState({ title: "", text: "" });
  const [b, setB] = useState({ title: "", text: "" });
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const aiRef = useRef("");

  async function run() {
    if (!a.text.trim() || !b.text.trim()) return;
    setBusy(true);
    setResult(null);
    setAi("");
    try {
      const r = await api.compare({ title_a: a.title || "Article A", text_a: a.text, title_b: b.title || "Article B", text_b: b.text });
      setResult(r.result);
    } finally {
      setBusy(false);
    }
  }

  async function askAI() {
    setAi("");
    setAiBusy(true);
    aiRef.current = "";
    try {
      await streamAI(
        { compare: { title_a: a.title || "Article A", text_a: a.text, title_b: b.title || "Article B", text_b: b.text }, analysis: result ?? undefined },
        (d) => {
          aiRef.current += d;
          setAi(aiRef.current);
        }
      );
    } finally {
      setAiBusy(false);
    }
  }

  const r = result;

  return (
    <div>
      <div className="grid cols-2">
        <div className="card">
          <div className="label">ARTICLE A</div>
          <Input placeholder="Title A…" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} />
          <span className="field-label">TEXT A</span>
          <Textarea value={a.text} onChange={(e) => setA({ ...a, text: e.target.value })} />
        </div>
        <div className="card">
          <div className="label">ARTICLE B</div>
          <Input placeholder="Title B…" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} />
          <span className="field-label">TEXT B</span>
          <Textarea value={b.text} onChange={(e) => setB({ ...b, text: e.target.value })} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <Button variant="primary" onClick={run} disabled={busy || !a.text.trim() || !b.text.trim()}>
          {busy ? "ANALYZING…" : "RUN FULL COMPARISON"}
        </Button>
        {result && (
          <Button onClick={askAI} disabled={aiBusy}>
            {aiBusy ? "ANALYST STREAMING…" : "ASK AI ANALYST"}
          </Button>
        )}
      </div>

      {r && (
        <div className="result-panel">
          <div className="label">COMPARISON RESULT</div>
          <div className="grid cols-2" style={{ marginBottom: 22 }}>
            <Card label="TF-IDF COSINE SIMILARITY" big={r.similarity_percent + "%"} bigClass="blue" desc="shared vocabulary weight" />
            <Card label="LCS (DP)" big={r.lcs.length} bigClass="green" desc="longest common token sequence" />
          </div>
          <div className="kv" style={{ marginBottom: 18 }}>
            <span className="k">SHARED KEYWORDS</span>
            <span className="v">{r.shared_keywords.map((k: string) => <span key={k} className="chip blue">{k}</span>)}</span>
            <span className="k">KMP TOTAL MATCHES</span><span className="v">{r.kmp.total_matches} exact positions in B</span>
            <span className="k">TRIE VOCAB (A)</span><span className="v">{r.trie.vocab_size} words indexed</span>
            <span className="k">RABIN-KARP VERIFIED</span><span className="v">{r.rabin_karp.verified} phrase collisions</span>
            <span className="k">ROLLING HASH</span>
            <span className="v">{r.rolling_hash.shared} shared fingerprints of window {r.rolling_hash.window} (A produced {r.rolling_hash.fingerprints_a})</span>
          </div>
          {r.rabin_karp.matches.length > 0 && (
            <table className="table" style={{ marginBottom: 18 }}>
              <thead><tr><th>RABIN-KARP PHRASE</th><th>POSITIONS IN B</th></tr></thead>
              <tbody>
                {r.rabin_karp.matches.map((m: any) => (
                  <tr key={m.phrase}><td>{m.phrase}</td><td>{m.positions.join(", ")}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {r.lcs.sequence_preview && (
            <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.7 }}>
              <b style={{ color: "var(--text)" }}>LCS preview:</b> {r.lcs.sequence_preview}…
            </p>
          )}
        </div>
      )}

      {(ai || aiBusy) && (
        <div style={{ marginTop: 22 }}>
          <div className="section-title">AI ANALYST — STREAMED</div>
          <div className="ai-stream">{ai}{aiBusy && <span className="ai-cursor" />}</div>
        </div>
      )}
    </div>
  );
}

/* ================= KEYWORD LAB ================= */

function KeywordLab() {
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!text.trim() || !keyword.trim()) return;
    setBusy(true);
    try {
      const r = await api.keywords({ text, keyword });
      setResult(r.result);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid cols-2">
        <div className="card">
          <div className="label">CORPUS</div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste text to search…" />
          <span className="field-label">KEYWORD / PATTERN</span>
          <div className="row">
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. election" />
            <Button variant="primary" onClick={run} disabled={busy || !text.trim() || !keyword.trim()}>
              {busy ? "SEARCHING…" : "SEARCH"}
            </Button>
          </div>
        </div>
        <div>
          {result ? (
            <div className="result-panel">
              <div className="label">PATTERN: {result.keyword.toUpperCase()}</div>
              <div className="kv">
                <span className="k">IN VOCABULARY (TRIE)</span>
                <span className="v">{result.in_vocab ? "yes" : "no"}</span>
                <span className="k">KMP OCCURRENCES</span>
                <span className="v">{result.kmp_count}</span>
                <span className="k">KMP POSITIONS</span>
                <span className="v" style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{result.kmp_positions.join(", ") || "—"}</span>
                <span className="k">RABIN-KARP VERIFY</span>
                <span className="v">{result.rk_verified ? "positions match KMP exactly" : "mismatch — check"}</span>
                <span className="k">TRIE AUTOCOMPLETE</span>
                <span className="v">{result.trie_autocomplete.map((t: string) => <span key={t} className="chip yellow">{t}</span>)}</span>
              </div>
            </div>
          ) : (
            <div className="empty">RUN A SEARCH TO SEE KMP + TRIE OUTPUT</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= HISTORY ================= */

function History() {
  const { data, loading } = useQuery(() => api.history());
  const items: any[] = data?.items ?? [];
  return (
    <div>
      <div className="section-title">SAVED ANALYSES</div>
      {loading ? <div className="empty">LOADING…</div> : items.length === 0 ? (
        <div className="empty">NO ANALYSES YET — RUN ONE FROM DETECT OR COMPARE</div>
      ) : (
        items.map((it) => (
          <div className="history-item" key={it._id}>
            <div className="t">{it.title}</div>
            <div className="m">{it.type.toUpperCase()} · {new Date(it.created_at).toLocaleString()}</div>
          </div>
        ))
      )}
    </div>
  );
}

/* ================= REPORTS ================= */

function Reports() {
  const { data, loading, refetch } = useQuery(() => api.reports());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [toast, setToast] = useState("");
  const items: any[] = data?.items ?? [];

  async function save() {
    if (!title.trim() || !content.trim()) return;
    await api.createReport({ title, content });
    setTitle("");
    setContent("");
    setToast("Report saved");
    setTimeout(() => setToast(""), 2200);
    refetch();
  }

  return (
    <div>
      <div className="grid cols-2">
        <div className="card">
          <div className="label">NEW REPORT</div>
          <span className="field-label">TITLE</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title…" />
          <span className="field-label">CONTENT</span>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste analysis findings…" style={{ minHeight: 140 }} />
          <div className="row" style={{ marginTop: 16 }}>
            <Button variant="primary" onClick={save} disabled={!title.trim() || !content.trim()}>SAVE REPORT</Button>
            <Button onClick={() => downloadText((title || "signal-desk-report") + ".txt", content)} disabled={!content.trim()}>DOWNLOAD .TXT</Button>
          </div>
        </div>
        <div>
          <div className="section-title" style={{ marginTop: 0 }}>SAVED REPORTS</div>
          {loading ? <div className="empty">LOADING…</div> : items.length === 0 ? (
            <div className="empty">NO REPORTS YET</div>
          ) : (
            items.map((r) => (
              <div className="history-item" key={r._id}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="t">{r.title}</div>
                  <Button onClick={() => downloadText(r.title + ".txt", r.content)}>DOWNLOAD</Button>
                </div>
                <div className="m">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
