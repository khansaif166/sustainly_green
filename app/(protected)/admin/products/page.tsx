"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, XCircle, Trash2, Search, Star, Megaphone, Package, Clock, ShoppingBag } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Product = {
  vendorName: string;
  id: string;
  title: string;
  description: string;
  images?: string[];
  categoryId: string;
  subCategoryId: string;
  vendorId: string;
  price?: number;
  priceType?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  featured?: boolean;
  isAd?: boolean;
};

const STATUS_META: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  APPROVED: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e", label: "Approved" },
  PENDING:  { bg: "#fefce8", color: "#92400e", dot: "#f59e0b", label: "Pending"  },
  REJECTED: { bg: "#fef2f2", color: "#991b1b", dot: "#ef4444", label: "Rejected" },
};

export default function AdminProductsPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [category,    setCategory]    = useState("ALL");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { setError("Please login again."); setLoading(false); return; }
      try {
        const res = await fetch("/api/admin/products", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load products.");
        setProducts(payload.products || []);
        setCategories(payload.categories || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load products.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  async function updateStatus(id: string, newStatus: Product["status"]) {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    if (!res.ok) return;
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function toggleFeatured(id: string, current: boolean) {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !current }),
    });
    if (!res.ok) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: !current } : p));
  }

  async function toggleAd(id: string, current: boolean) {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ isAd: !current }),
    });
    if (!res.ok) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isAd: !current } : p));
  }

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.title?.toLowerCase().includes(q) || p.vendorName?.toLowerCase().includes(q);
    const matchStatus   = status   === "ALL" || p.status   === status;
    const matchCategory = category === "ALL" || p.categoryId === category;
    return matchSearch && matchStatus && matchCategory;
  }), [products, search, status, category]);

  const pending  = products.filter(p => p.status === "PENDING").length;
  const approved = products.filter(p => p.status === "APPROVED").length;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .apr-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .apr-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .apr-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .apr-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .apr-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .apr-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .apr-hero-stats{display:flex;gap:20px}
        .apr-hero-stat{text-align:right}
        .apr-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .apr-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .apr-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .apr-search{position:relative;flex:1;min-width:200px}
        .apr-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .apr-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .apr-search input:focus{border-color:#16a34a}
        .apr-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111}
        .apr-select:focus{border-color:#16a34a}
        .apr-add{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;text-decoration:none;box-shadow:0 2px 8px rgba(22,163,74,.25);transition:all .15s}
        .apr-add:hover{background:#15803d}

        .apr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
        .apr-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column}
        .apr-img{width:100%;height:160px;object-fit:cover;background:#f8faf9;display:block}
        .apr-img-ph{width:100%;height:160px;background:#f0fdf4;display:flex;align-items:center;justify-content:center}
        .apr-card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:5px}
        .apr-card-foot{padding:10px 12px;border-top:1px solid #f3f4f6;display:flex;gap:7px;flex-wrap:wrap;align-items:center}

        .apr-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:50px}
        .apr-price{font-size:13px;font-weight:800;color:#16a34a;margin:0}
        .apr-vendor{font-size:11.5px;color:#9ca3af;margin:0}
        .apr-title{font-size:13.5px;font-weight:800;color:#111;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

        .apr-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 12px;border-radius:50px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;border:none}
        .apr-btn-edit{background:#eff6ff;color:#3b82f6}
        .apr-btn-edit:hover{background:#dbeafe}
        .apr-btn-feat-on{background:#fefce8;color:#92400e}
        .apr-btn-feat-off{background:#f9fafb;color:#6b7280;border:1.5px solid rgba(0,0,0,.08)}
        .apr-btn-ad-on{background:#faf5ff;color:#9333ea}
        .apr-btn-ad-off{background:#f9fafb;color:#6b7280;border:1.5px solid rgba(0,0,0,.08)}
        .apr-btn-approve{background:#16a34a;color:#fff;box-shadow:0 2px 6px rgba(22,163,74,.2)}
        .apr-btn-reject{background:#fef2f2;color:#dc2626}
        .apr-btn-del{width:30px;height:30px;padding:0;border-radius:50%;background:#fef2f2;color:#dc2626;border:1.5px solid rgba(220,38,38,.15);margin-left:auto}
        .apr-btn-del:hover{background:#fee2e2}

        .apr-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:40px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
        .apr-err{background:#fef2f2;border:1px solid rgba(220,38,38,.12);border-radius:14px;padding:12px 16px;font-size:13px;color:#dc2626}
      `}</style>

      <div className="apr-page">

        {/* Hero */}
        <div className="apr-hero">
          <div className="apr-hero-inner">
            <div>
              <h1 className="apr-hero-title">Products</h1>
              <p className="apr-hero-sub">Review, approve and manage vendor product listings</p>
            </div>
            <div className="apr-hero-stats">
              <div className="apr-hero-stat">
                <p className="apr-hero-stat-val">{products.length}</p>
                <p className="apr-hero-stat-label">Total</p>
              </div>
              <div className="apr-hero-stat">
                <p className="apr-hero-stat-val" style={{ color: "#fbbf24" }}>{pending}</p>
                <p className="apr-hero-stat-label">Pending</p>
              </div>
              <div className="apr-hero-stat">
                <p className="apr-hero-stat-val">{approved}</p>
                <p className="apr-hero-stat-label">Approved</p>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="apr-err">{error}</div>}

        {/* Filter + Add bar */}
        <div className="apr-bar">
          <div className="apr-search">
            <Search size={14} color="#9ca3af" className="apr-search-icon" />
            <input placeholder="Search product or vendor…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="apr-select" value={status} onChange={e => setStatus(e.target.value as any)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select className="apr-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="ALL">All Categories</option>
            {Object.entries(categories).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <a href="/admin/products/new" className="apr-add">
            <Package size={14} /> Add Product
          </a>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="apr-empty">No products match your filters.</div>
        ) : (
          <div className="apr-grid">
            {filtered.map(p => {
              const sm = STATUS_META[p.status] || STATUS_META.PENDING;
              return (
                <div key={p.id} className="apr-card">
                  {/* Image */}
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} className="apr-img" />
                    : <div className="apr-img-ph"><ShoppingBag size={32} color="#86efac" /></div>
                  }

                  {/* Body */}
                  <div className="apr-card-body">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p className="apr-title">{p.title}</p>
                      <span className="apr-badge" style={{ background: sm.bg, color: sm.color, flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot }} />
                        {sm.label}
                      </span>
                    </div>
                    <p className="apr-vendor">by {p.vendorName || "Unknown vendor"}</p>
                    {p.price && <p className="apr-price">₹{p.price}</p>}
                    {p.priceType && !p.price && <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{p.priceType}</p>}
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      {p.featured && <span style={{ fontSize: 10.5, background: "#fefce8", color: "#92400e", padding: "2px 8px", borderRadius: 50, fontWeight: 700 }}>★ Featured</span>}
                      {p.isAd && <span style={{ fontSize: 10.5, background: "#faf5ff", color: "#9333ea", padding: "2px 8px", borderRadius: 50, fontWeight: 700 }}>Ad</span>}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="apr-card-foot">
                    <a href={`/admin/products/${p.id}`} className="apr-btn apr-btn-edit">Edit</a>
                    <button onClick={() => toggleFeatured(p.id, !!p.featured)} className={`apr-btn ${p.featured ? "apr-btn-feat-on" : "apr-btn-feat-off"}`}>
                      <Star size={11} />{p.featured ? "Featured" : "Feature"}
                    </button>
                    <button onClick={() => toggleAd(p.id, !!p.isAd)} className={`apr-btn ${p.isAd ? "apr-btn-ad-on" : "apr-btn-ad-off"}`}>
                      <Megaphone size={11} />{p.isAd ? "Ad On" : "Run Ad"}
                    </button>
                    {p.status !== "APPROVED" && (
                      <button onClick={() => updateStatus(p.id, "APPROVED")} className="apr-btn apr-btn-approve">
                        <CheckCircle size={11} />Approve
                      </button>
                    )}
                    {p.status !== "REJECTED" && (
                      <button onClick={() => updateStatus(p.id, "REJECTED")} className="apr-btn apr-btn-reject">
                        <XCircle size={11} />Reject
                      </button>
                    )}
                    <button onClick={() => deleteProduct(p.id)} className="apr-btn apr-btn-del" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
