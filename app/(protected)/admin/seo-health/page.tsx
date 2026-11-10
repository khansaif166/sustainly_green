"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Search, RefreshCw } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";
import { readApiJson } from "@/lib/clientApiResponse";
import { SEO_ISSUES, type SeoIssueCode } from "@/lib/productSeo";

type ProductReport = {
  id: string;
  title: string;
  vendorName: string;
  words: number;
  imageCount: number;
  score: number;
  issues: SeoIssueCode[];
  publicUrl: string;
};

type Summary = {
  total: number;
  averageScore: number;
  healthy: number;
  needsWork: number;
  poor: number;
  issueCounts: Record<SeoIssueCode, number>;
};

type Band = "ALL" | "POOR" | "NEEDS_WORK" | "HEALTHY";

const PAGE_SIZE = 30;

function scoreTone(score: number) {
  // heroColor is the same tone, brightened for the dark hero background.
  if (score >= 80) return { bg: "#f0fdf4", color: "#15803d", heroColor: "#4ade80", label: "Healthy" };
  if (score >= 50) return { bg: "#fefce8", color: "#92400e", heroColor: "#fbbf24", label: "Needs work" };
  return { bg: "#fef2f2", color: "#b91c1c", heroColor: "#f87171", label: "Poor" };
}

export default function AdminSeoHealthPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [products, setProducts] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadTick, setReloadTick] = useState(0);

  const [search, setSearch] = useState("");
  const [band, setBand] = useState<Band>("ALL");
  const [issue, setIssue] = useState<SeoIssueCode | "ALL">("ALL");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const session = getStoredSession();
      if (!session) { setError("Please log in again."); setLoading(false); return; }
      setLoading(true);
      try {
        const res = await fetch("/api/admin/products/seo-health", {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const payload = await readApiJson<{ summary?: Summary; products?: ProductReport[] }>(
          res,
          "Unable to load SEO health.",
        );
        if (cancelled) return;
        setSummary(payload.summary || null);
        setProducts(payload.products || []);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load SEO health.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [reloadTick]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (band === "POOR" && p.score >= 50) return false;
      if (band === "NEEDS_WORK" && (p.score < 50 || p.score >= 80)) return false;
      if (band === "HEALTHY" && p.score < 80) return false;
      if (issue !== "ALL" && !p.issues.includes(issue)) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.vendorName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, band, issue, search]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [band, issue, search]);

  const issueCodes = (Object.keys(SEO_ISSUES) as SeoIssueCode[])
    .filter((code) => (summary?.issueCounts[code] || 0) > 0)
    .sort((a, b) => (summary?.issueCounts[b] || 0) - (summary?.issueCounts[a] || 0));

  if (loading && !summary) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const overall = scoreTone(summary?.averageScore ?? 100);

  return (
    <>
      <style>{`
        .seo-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .seo-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .seo-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .seo-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .seo-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .seo-hero-sub{font-size:13px;color:rgba(255,255,255,.45);margin:0;max-width:520px;line-height:1.5}
        .seo-hero-stats{display:flex;gap:22px;flex-wrap:wrap}
        .seo-hero-stat{text-align:right}
        .seo-hero-val{font-size:26px;font-weight:900;letter-spacing:-.03em;line-height:1;margin:0;font-variant-numeric:tabular-nums}
        .seo-hero-label{font-size:10.5px;color:rgba(255,255,255,.35);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .seo-bands{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
        .seo-band{border-radius:16px;padding:14px 16px;border:1.5px solid transparent;cursor:pointer;text-align:left;font-family:inherit;transition:border-color .15s}
        .seo-band.active{border-color:currentColor}
        .seo-band-val{font-size:22px;font-weight:900;line-height:1;margin:0 0 3px;font-variant-numeric:tabular-nums}
        .seo-band-label{font-size:12px;font-weight:700;margin:0}

        .seo-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:16px 18px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .seo-card-title{font-size:13.5px;font-weight:800;color:#111;margin:0 0 10px}
        .seo-chips{display:flex;flex-wrap:wrap;gap:8px}
        .seo-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:50px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid rgba(0,0,0,.08);background:#f9fafb;color:#374151;transition:all .15s}
        .seo-chip:hover{border-color:#16a34a}
        .seo-chip.active{background:#16a34a;border-color:#16a34a;color:#fff}
        .seo-chip-count{font-variant-numeric:tabular-nums;opacity:.75}

        .seo-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:12px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .seo-search{position:relative;flex:1;min-width:200px}
        .seo-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .seo-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111}
        .seo-search input:focus{border-color:#16a34a}
        .seo-count{font-size:12.5px;color:#6b7280;font-weight:600}
        .seo-refresh{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:50px;font-size:12px;font-weight:700;background:#f9fafb;border:1.5px solid rgba(0,0,0,.08);color:#374151;cursor:pointer;font-family:inherit}

        .seo-list{display:flex;flex-direction:column;gap:10px}
        .seo-row{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}
        .seo-score{width:52px;height:52px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
        .seo-score-val{font-size:18px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}
        .seo-score-label{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
        .seo-main{flex:1;min-width:220px}
        .seo-title{font-size:14px;font-weight:800;color:#111;margin:0;overflow-wrap:anywhere}
        .seo-meta{font-size:12px;color:#6b7280;margin:2px 0 8px}
        .seo-issues{display:flex;flex-direction:column;gap:5px}
        .seo-issue{font-size:12px;line-height:1.45;color:#374151}
        .seo-issue b{font-weight:700}
        .seo-sev{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:1px}
        .seo-actions{display:flex;gap:7px;flex-shrink:0}
        .seo-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:50px;font-size:12px;font-weight:700;text-decoration:none;transition:background .15s}
        .seo-btn-edit{background:#eff6ff;color:#2563eb}
        .seo-btn-edit:hover{background:#dbeafe}
        .seo-btn-view{background:#f9fafb;color:#374151;border:1.5px solid rgba(0,0,0,.08)}
        .seo-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:36px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
        .seo-err{background:#fef2f2;border:1px solid rgba(220,38,38,.12);border-radius:14px;padding:12px 16px;font-size:13px;color:#dc2626}
        .seo-more{align-self:center;padding:9px 20px;border-radius:50px;font-size:12.5px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit}
      `}</style>

      <div className="seo-page">
        <div className="seo-hero">
          <div className="seo-hero-inner">
            <div>
              <h1 className="seo-hero-title">SEO Health</h1>
              <p className="seo-hero-sub">
                Checks every live product for the things that stop Google indexing or ranking it.
                Fix the lowest scores first, then request indexing in Search Console.
              </p>
            </div>
            <div className="seo-hero-stats">
              <div className="seo-hero-stat">
                <p className="seo-hero-val" style={{ color: overall.heroColor }}>
                  {summary?.averageScore ?? 0}
                </p>
                <p className="seo-hero-label">Avg score</p>
              </div>
              <div className="seo-hero-stat">
                <p className="seo-hero-val" style={{ color: "#4ade80" }}>{summary?.total ?? 0}</p>
                <p className="seo-hero-label">Live products</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="seo-err" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span>{error}</span>
            <button className="seo-refresh" onClick={() => setReloadTick((t) => t + 1)}>Retry</button>
          </div>
        )}

        {summary && (
          <div className="seo-bands">
            {([
              { key: "ALL", label: "All products", val: summary.total, bg: "#f9fafb", color: "#374151" },
              { key: "POOR", label: "Poor (<50)", val: summary.poor, bg: "#fef2f2", color: "#b91c1c" },
              { key: "NEEDS_WORK", label: "Needs work (50–79)", val: summary.needsWork, bg: "#fefce8", color: "#92400e" },
              { key: "HEALTHY", label: "Healthy (80+)", val: summary.healthy, bg: "#f0fdf4", color: "#15803d" },
            ] as const).map((b) => (
              <button
                key={b.key}
                className={`seo-band${band === b.key ? " active" : ""}`}
                style={{ background: b.bg, color: b.color }}
                onClick={() => setBand(b.key)}
              >
                <p className="seo-band-val">{b.val}</p>
                <p className="seo-band-label">{b.label}</p>
              </button>
            ))}
          </div>
        )}

        {issueCodes.length > 0 && (
          <div className="seo-card">
            <p className="seo-card-title">Filter by issue</p>
            <div className="seo-chips">
              <button className={`seo-chip${issue === "ALL" ? " active" : ""}`} onClick={() => setIssue("ALL")}>
                All issues
              </button>
              {issueCodes.map((code) => (
                <button
                  key={code}
                  className={`seo-chip${issue === code ? " active" : ""}`}
                  onClick={() => setIssue(code)}
                >
                  <span
                    className="seo-sev"
                    style={{ margin: 0, background: SEO_ISSUES[code].severity === "critical" ? "#ef4444" : "#f59e0b" }}
                  />
                  {SEO_ISSUES[code].label}
                  <span className="seo-chip-count">{summary?.issueCounts[code]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="seo-bar">
          <div className="seo-search">
            <Search size={14} color="#9ca3af" />
            <input placeholder="Search product or vendor…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="seo-count">{filtered.length} shown</span>
          <button className="seo-refresh" onClick={() => setReloadTick((t) => t + 1)} disabled={loading}>
            <RefreshCw size={12} /> {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="seo-empty">
            {products.length === 0 ? "No live products yet." : "No products match these filters."}
          </div>
        ) : (
          <div className="seo-list">
            {filtered.slice(0, visible).map((p) => {
              const tone = scoreTone(p.score);
              return (
                <div key={p.id} className="seo-row">
                  <div className="seo-score" style={{ background: tone.bg, color: tone.color }}>
                    <span className="seo-score-val">{p.score}</span>
                    <span className="seo-score-label">{tone.label}</span>
                  </div>
                  <div className="seo-main">
                    <p className="seo-title">{p.title}</p>
                    <p className="seo-meta">
                      {p.vendorName} · {p.words} words · {p.imageCount} image{p.imageCount === 1 ? "" : "s"}
                    </p>
                    {p.issues.length === 0 ? (
                      <p className="seo-issue" style={{ color: "#15803d", margin: 0 }}>No issues found.</p>
                    ) : (
                      <div className="seo-issues">
                        {p.issues.map((code) => (
                          <span key={code} className="seo-issue">
                            <span
                              className="seo-sev"
                              style={{ background: SEO_ISSUES[code].severity === "critical" ? "#ef4444" : "#f59e0b" }}
                            />
                            <b>{SEO_ISSUES[code].label}:</b> {SEO_ISSUES[code].fix}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="seo-actions">
                    <Link href={`/admin/products/${p.id}`} className="seo-btn seo-btn-edit">
                      <Pencil size={11} /> Edit
                    </Link>
                    <a href={p.publicUrl} target="_blank" rel="noopener noreferrer" className="seo-btn seo-btn-view">
                      <ExternalLink size={11} /> View
                    </a>
                  </div>
                </div>
              );
            })}
            {visible < filtered.length && (
              <button className="seo-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Show more ({filtered.length - visible} left)
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
