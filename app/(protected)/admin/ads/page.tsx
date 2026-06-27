"use client";

import { useEffect, useMemo, useState } from "react";
import { Megaphone, CheckCircle, XCircle, Trash2, Search, Eye, MousePointerClick, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

type Ad = {
  id: string;
  title: string;
  vendorId: string;
  images?: string[];
  isAd: boolean;
  adStatus: "PENDING" | "APPROVED" | "REJECTED";
  adActive?: boolean;
  impressions?: number;
  clicks?: number;
  budget?: number;
};

const STATUS_META: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  APPROVED: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", label: "Approved" },
  PENDING:  { bg: "#fefce8", color: "#92400e", dot: "#f59e0b", label: "Pending"  },
  REJECTED: { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444", label: "Rejected" },
};

export default function AdminAdsPage() {
  const [ads,           setAds]           = useState<Ad[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [status,        setStatus]        = useState<"ALL"|"PENDING"|"APPROVED"|"REJECTED">("ALL");
  const [page,          setPage]          = useState(1);
  const [currentBanner, setCurrentBanner] = useState<any>(null);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [bannerUrl,     setBannerUrl]     = useState("");
  const [bannerImage,   setBannerImage]   = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const PAGE_SIZE = 6;

  function getAuthHeaders() {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    return { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
  }

  useEffect(() => { loadAds(); }, []);

  useEffect(() => {
    async function loadBanner() {
      try {
        const res = await fetch("/api/admin/ads/banner", { headers: { Authorization: getAuthHeaders().Authorization } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load banner.");
        if (payload.banner) { setCurrentBanner(payload.banner); setBannerUrl(payload.banner.imageUrl || ""); setBannerPreview(payload.banner.imageUrl || ""); }
      } catch (e) { console.error(e); } finally { setLoadingBanner(false); }
    }
    loadBanner();
  }, []);

  async function loadAds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads", { headers: { Authorization: getAuthHeaders().Authorization } });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Unable to load ads.");
      setAds(payload.ads || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function uploadBanner() {
    if (!bannerUrl.trim() && !bannerImage) return alert("Add a banner image");
    const authHeaders = getAuthHeaders();
    const uploaded = bannerImage
      ? await uploadFileToSupabaseStorage(bannerImage, { bucket: "marketplace", folder: "banners", accessToken: authHeaders.Authorization.replace(/^Bearer\s+/i, "") })
      : null;
    const finalUrl = uploaded?.url || bannerUrl;
    const res = await fetch("/api/admin/ads/banner", { method: "PUT", headers: authHeaders, body: JSON.stringify({ imageUrl: finalUrl, linkUrl: currentBanner?.linkUrl || "/browse", active: true }) });
    const payload = await res.json();
    if (!res.ok) { alert(payload?.error?.message || "Unable to update banner."); return; }
    setCurrentBanner({ imageUrl: finalUrl, linkUrl: "/browse", active: true });
    setBannerUrl(finalUrl); setBannerImage(null); setBannerPreview(finalUrl);
    alert("Banner updated successfully");
  }

  async function toggleBanner() {
    if (!currentBanner) return;
    const res = await fetch("/api/admin/ads/banner", { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ active: !currentBanner.active }) });
    if (!res.ok) return;
    setCurrentBanner((prev: any) => ({ ...prev, active: !prev.active }));
  }

  async function deleteBanner() {
    if (!confirm("Delete banner permanently?")) return;
    const res = await fetch("/api/admin/ads/banner", { method: "DELETE", headers: { Authorization: getAuthHeaders().Authorization } });
    if (!res.ok) return;
    setCurrentBanner(null); setBannerUrl(""); setBannerPreview("");
  }

  async function updateStatus(id: string, newStatus: Ad["adStatus"]) {
    const res = await fetch(`/api/admin/ads/${id}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ adStatus: newStatus }) });
    if (!res.ok) return;
    setAds(prev => prev.map(a => a.id === id ? { ...a, adStatus: newStatus, adActive: newStatus === "APPROVED" } : a));
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/ads/${id}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ adActive: !current }) });
    if (!res.ok) return;
    setAds(prev => prev.map(a => a.id === id ? { ...a, adActive: !current } : a));
  }

  async function deleteAd(id: string) {
    if (!confirm("Delete this ad permanently?")) return;
    const res = await fetch(`/api/admin/ads/${id}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ remove: true }) });
    if (!res.ok) return;
    setAds(prev => prev.filter(a => a.id !== id));
  }

  const totalAds        = ads.length;
  const activeAds       = ads.filter(a => a.adActive && a.adStatus === "APPROVED").length;
  const pendingAds      = ads.filter(a => a.adStatus === "PENDING").length;
  const totalClicks     = ads.reduce((s, a) => s + (a.clicks || 0), 0);
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);

  const filtered   = useMemo(() => ads.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "ALL" || a.adStatus === status;
    return matchSearch && matchStatus;
  }), [ads, search, status]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .aad-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .aad-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .aad-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .aad-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .aad-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .aad-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .aad-hero-stats{display:flex;gap:20px}
        .aad-hero-stat{text-align:right}
        .aad-hero-stat-val{font-size:22px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .aad-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .aad-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
        .aad-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 2px 6px rgba(0,0,0,.04)}
        .aad-kpi-icon{width:36px;height:36px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .aad-kpi-val{font-size:20px;font-weight:900;color:#111;margin:0;line-height:1}
        .aad-kpi-label{font-size:11px;color:#6b7280;margin:2px 0 0;font-weight:600}

        .aad-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .aad-search{position:relative;flex:1;min-width:200px}
        .aad-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .aad-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .aad-search input:focus{border-color:#16a34a}
        .aad-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111}
        .aad-select:focus{border-color:#16a34a}

        .aad-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .aad-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column}
        .aad-card-img{width:100%;height:160px;object-fit:cover;display:block;background:#f0fdf4}
        .aad-card-img-ph{width:100%;height:160px;background:#f0fdf4;display:flex;align-items:center;justify-content:center}
        .aad-card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:6px}
        .aad-card-title{font-size:13.5px;font-weight:800;color:#111;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .aad-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:50px}
        .aad-stats-row{display:flex;gap:12px;font-size:12px;color:#6b7280}
        .aad-card-foot{padding:10px 12px;border-top:1px solid #f3f4f6;display:flex;gap:7px;flex-wrap:wrap}
        .aad-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 12px;border-radius:50px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none}
        .aad-btn-run{background:#f0fdf4;color:#15803d}
        .aad-btn-paused{background:#f3f4f6;color:#6b7280;border:1.5px solid rgba(0,0,0,.08)}
        .aad-btn-approve{background:#16a34a;color:#fff;box-shadow:0 2px 6px rgba(22,163,74,.2)}
        .aad-btn-reject{background:#fef2f2;color:#dc2626}
        .aad-btn-del{width:30px;height:30px;padding:0;border-radius:50%;background:#fef2f2;color:#dc2626;border:1.5px solid rgba(220,38,38,.12)}
        .aad-btn-del:hover{background:#fee2e2}

        .aad-pagination{display:flex;align-items:center;justify-content:space-between;padding:14px 0}
        .aad-page-btn{width:32px;height:32px;border-radius:10px;border:1.5px solid rgba(0,0,0,.1);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
        .aad-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .aad-page-btn:not(:disabled):hover{background:#f0fdf4;border-color:#16a34a}

        .aad-banner-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:16px}
        .aad-banner-title{font-size:16px;font-weight:800;color:#111;margin:0}
        .aad-banner-sub{font-size:13px;color:#6b7280;margin:3px 0 0}
        .aad-banner-status-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
        .aad-banner-btns{display:flex;gap:10px;flex-wrap:wrap}
        .aad-banner-toggle{padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;background:#111;color:#fff;border:none;cursor:pointer;font-family:inherit;transition:all .15s}
        .aad-banner-toggle:hover{background:#374151}
        .aad-banner-del{padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;background:#dc2626;color:#fff;border:none;cursor:pointer;font-family:inherit}
        .aad-banner-img{width:100%;max-height:260px;object-fit:cover;border-radius:14px;border:1px solid rgba(0,0,0,.07);display:block}
        .aad-banner-ph{height:120px;background:#f0fdf4;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#9ca3af}
        .aad-banner-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
        .aad-banner-input{width:100%;padding:10px 14px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .aad-banner-input:focus{border-color:#16a34a}
        .aad-upload-zone{display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed rgba(0,0,0,.1);border-radius:12px;padding:20px;cursor:pointer;transition:all .15s;font-size:13px;color:#9ca3af;text-align:center}
        .aad-upload-zone:hover{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
        .aad-banner-save{display:inline-flex;align-items:center;padding:10px 22px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(22,163,74,.2)}
        .aad-active-badge{display:inline-block;padding:3px 10px;border-radius:50px;font-size:11.5px;font-weight:700;background:#f0fdf4;color:#15803d}
        .aad-stopped-badge{display:inline-block;padding:3px 10px;border-radius:50px;font-size:11.5px;font-weight:700;background:#f3f4f6;color:#6b7280}
        .aad-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:32px;text-align:center;font-size:13.5px;color:#9ca3af}
      `}</style>

      <div className="aad-page">

        {/* Hero */}
        <div className="aad-hero">
          <div className="aad-hero-inner">
            <div>
              <h1 className="aad-hero-title">Ads Management</h1>
              <p className="aad-hero-sub">Approve, monitor and control promoted product ads</p>
            </div>
            <div className="aad-hero-stats">
              <div className="aad-hero-stat">
                <p className="aad-hero-stat-val">{totalAds}</p>
                <p className="aad-hero-stat-label">Total</p>
              </div>
              <div className="aad-hero-stat">
                <p className="aad-hero-stat-val" style={{ color: "#fbbf24" }}>{pendingAds}</p>
                <p className="aad-hero-stat-label">Pending</p>
              </div>
              <div className="aad-hero-stat">
                <p className="aad-hero-stat-val">{activeAds}</p>
                <p className="aad-hero-stat-label">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="aad-kpis">
          <div className="aad-kpi">
            <div><p className="aad-kpi-val">{totalAds}</p><p className="aad-kpi-label">Total Ads</p></div>
            <div className="aad-kpi-icon"><Megaphone size={16} color="#16a34a" /></div>
          </div>
          <div className="aad-kpi">
            <div><p className="aad-kpi-val">{activeAds}</p><p className="aad-kpi-label">Active Ads</p></div>
            <div className="aad-kpi-icon" style={{ background: "#fefce8" }}><CheckCircle size={16} color="#ca8a04" /></div>
          </div>
          <div className="aad-kpi">
            <div><p className="aad-kpi-val">{totalImpressions.toLocaleString()}</p><p className="aad-kpi-label">Impressions</p></div>
            <div className="aad-kpi-icon" style={{ background: "#eff6ff" }}><Eye size={16} color="#3b82f6" /></div>
          </div>
          <div className="aad-kpi">
            <div><p className="aad-kpi-val">{totalClicks.toLocaleString()}</p><p className="aad-kpi-label">Clicks</p></div>
            <div className="aad-kpi-icon" style={{ background: "#faf5ff" }}><MousePointerClick size={16} color="#9333ea" /></div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="aad-bar">
          <div className="aad-search">
            <Search size={14} color="#9ca3af" className="aad-search-icon" />
            <input placeholder="Search ad by product title…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="aad-select" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Ads grid */}
        {paginated.length === 0 ? (
          <div className="aad-empty">No ads match your filters.</div>
        ) : (
          <div className="aad-grid">
            {paginated.map(a => {
              const sm = STATUS_META[a.adStatus] || STATUS_META.PENDING;
              return (
                <div key={a.id} className="aad-card">
                  {a.images?.[0]
                    ? <img src={a.images[0]} alt={a.title} className="aad-card-img" />
                    : <div className="aad-card-img-ph"><ShoppingBag size={28} color="#86efac" /></div>
                  }
                  <div className="aad-card-body">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p className="aad-card-title">{a.title}</p>
                      <span className="aad-badge" style={{ background: sm.bg, color: sm.color, flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot }} />{sm.label}
                      </span>
                    </div>
                    <div className="aad-stats-row">
                      <span><Eye size={11} style={{ display: "inline", marginRight: 3 }} />{a.impressions || 0}</span>
                      <span><MousePointerClick size={11} style={{ display: "inline", marginRight: 3 }} />{a.clicks || 0}</span>
                      {a.budget && <span>₹{a.budget}</span>}
                    </div>
                  </div>
                  <div className="aad-card-foot">
                    {a.adStatus === "APPROVED" && (
                      <button onClick={() => toggleActive(a.id, !!a.adActive)} className={`aad-btn ${a.adActive ? "aad-btn-run" : "aad-btn-paused"}`}>
                        {a.adActive ? "Running" : "Paused"}
                      </button>
                    )}
                    {a.adStatus !== "APPROVED" && (
                      <button onClick={() => updateStatus(a.id, "APPROVED")} className="aad-btn aad-btn-approve">
                        <CheckCircle size={11} />Approve
                      </button>
                    )}
                    {a.adStatus !== "REJECTED" && (
                      <button onClick={() => updateStatus(a.id, "REJECTED")} className="aad-btn aad-btn-reject">
                        <XCircle size={11} />Reject
                      </button>
                    )}
                    <button onClick={() => deleteAd(a.id)} className="aad-btn aad-btn-del"><Trash2 size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="aad-pagination">
            <span style={{ fontSize: 12.5, color: "#6b7280" }}>Page {page} of {totalPages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="aad-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
              <button className="aad-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Banner section */}
        <div className="aad-banner-card">
          <div>
            <p className="aad-banner-title">Homepage Hero Banner</p>
            <p className="aad-banner-sub">Manage your main marketing banner displayed on the homepage</p>
          </div>

          <div className="aad-banner-status-row">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 6px" }}>Banner Status</p>
              {currentBanner
                ? <span className={currentBanner.active ? "aad-active-badge" : "aad-stopped-badge"}>{currentBanner.active ? "Active" : "Stopped"}</span>
                : <span style={{ fontSize: 13, color: "#9ca3af" }}>No banner uploaded</span>
              }
            </div>
            {currentBanner && (
              <div className="aad-banner-btns">
                <button onClick={toggleBanner} className="aad-banner-toggle">{currentBanner.active ? "Pause Banner" : "Activate Banner"}</button>
                <button onClick={deleteBanner} className="aad-banner-del">Delete Banner</button>
              </div>
            )}
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 8px" }}>Current Preview</p>
            {loadingBanner
              ? <div className="aad-banner-ph">Loading banner…</div>
              : currentBanner?.imageUrl
                ? <img src={currentBanner.imageUrl} alt="banner" className="aad-banner-img" />
                : <div className="aad-banner-ph">No banner uploaded yet</div>
            }
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p className="aad-banner-label">Upload New Banner</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px" }}>Recommended: 1920×850px · Max 500KB · WebP preferred</p>
              <input className="aad-banner-input" placeholder="https://example.com/banner.webp" value={bannerUrl} onChange={e => { setBannerUrl(e.target.value); setBannerPreview(e.target.value); }} />
            </div>
            <label className="aad-upload-zone">
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBannerImage(file);
                setBannerPreview(URL.createObjectURL(file));
              }} />
              Or upload from device
            </label>
            {bannerPreview && (
              <img src={bannerPreview} alt="banner preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(0,0,0,.08)" }} />
            )}
            <div>
              <button onClick={uploadBanner} className="aad-banner-save">
                {currentBanner ? "Update Banner" : "Upload Banner"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
