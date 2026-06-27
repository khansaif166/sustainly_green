"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";
import { PlusCircle, Clock, CheckCircle2, Package, ArrowRight, ImageOff } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string;
  images?: string[];
  approved: boolean;
};

export default function VendorProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch("/api/vendor/products", { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load products.");
        setProducts(payload.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load products.");
      } finally { setLoading(false); }
    }
    load();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const approved = products.filter(p => p.approved).length;
  const pending  = products.filter(p => !p.approved).length;

  return (
    <>
      <style>{`
        .vp-page{display:flex;flex-direction:column;gap:20px;padding-bottom:32px}
        .vp-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .vp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 250px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .vp-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .vp-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.025em}
        .vp-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0 0 16px}
        .vp-add-btn{display:inline-flex;align-items:center;gap:7px;background:#16a34a;color:#fff;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;text-decoration:none;transition:background .15s;box-shadow:0 4px 14px rgba(22,163,74,.35)}
        .vp-add-btn:hover{background:#15803d}
        .vp-hero-stats{display:flex;gap:20px;align-items:center}
        .vp-hero-stat-val{font-size:28px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .vp-hero-stat-label{font-size:11px;color:rgba(255,255,255,.32);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .vp-pills{display:flex;gap:10px;flex-wrap:wrap}
        .vp-pill{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:50px;font-size:12.5px;font-weight:700;border:1px solid rgba(0,0,0,.07);background:#fff}

        .vp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
        .vp-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;transition:all .15s}
        .vp-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.1);transform:translateY(-3px)}
        .vp-img{height:175px;width:100%;object-fit:cover;background:#f8faf9}
        .vp-img-placeholder{height:175px;background:linear-gradient(135deg,#f8faf9,#f0fdf4);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
        .vp-card-body{padding:14px 16px;flex:1;display:flex;flex-direction:column;gap:8px}
        .vp-card-title{font-size:13.5px;font-weight:800;color:#111;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .vp-card-desc{font-size:12px;color:#6b7280;line-height:1.5;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .vp-card-footer{padding:12px 16px;border-top:1px solid #f9fafb;display:flex;align-items:center;justify-content:space-between}
        .vp-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px}
        .vp-view-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#16a34a;text-decoration:none;transition:gap .15s}
        .vp-view-btn:hover{gap:6px}

        .vp-empty{display:flex;flex-direction:column;align-items:center;gap:14px;padding:56px 24px;background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;text-align:center}
        .vp-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}
      `}</style>

      <div className="vp-page">
        {error && <div className="vp-err">{error}</div>}

        {/* Hero */}
        <div className="vp-hero">
          <div className="vp-hero-inner">
            <div>
              <h1 className="vp-hero-title">My Products</h1>
              <p className="vp-hero-sub">Manage and update your product listings</p>
              <Link href="/vendor/products/new" className="vp-add-btn">
                <PlusCircle size={14} />Add New Product
              </Link>
            </div>
            <div className="vp-hero-stats">
              <div style={{ textAlign: "right" }}>
                <p className="vp-hero-stat-val">{products.length}</p>
                <p className="vp-hero-stat-label">Total Products</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status summary pills */}
        {products.length > 0 && (
          <div className="vp-pills">
            <span className="vp-pill">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ color: "#15803d" }}>{approved} Approved</span>
            </span>
            <span className="vp-pill">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />
              <span style={{ color: "#92400e" }}>{pending} Pending Review</span>
            </span>
          </div>
        )}

        {/* Empty state */}
        {products.length === 0 && (
          <div className="vp-empty">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={28} color="#16a34a" />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>No products yet</p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Add your first product to start receiving RFQs from buyers.</p>
            </div>
            <Link href="/vendor/products/new" className="vp-add-btn">
              <PlusCircle size={14} />Add Your First Product
            </Link>
          </div>
        )}

        {/* Product grid */}
        {products.length > 0 && (
          <div className="vp-grid">
            {products.map(p => (
              <div key={p.id} className="vp-card">
                {p.images?.length ? (
                  <img src={p.images[0]} alt={p.title} className="vp-img" />
                ) : (
                  <div className="vp-img-placeholder">
                    <ImageOff size={24} color="#d1d5db" />
                    <span style={{ fontSize: 11.5, color: "#d1d5db", fontWeight: 600 }}>No image</span>
                  </div>
                )}

                <div className="vp-card-body">
                  <h2 className="vp-card-title">{p.title}</h2>
                  <p className="vp-card-desc">{p.description}</p>
                </div>

                <div className="vp-card-footer">
                  {p.approved ? (
                    <span className="vp-badge" style={{ background: "#f0fdf4", color: "#15803d" }}>
                      <CheckCircle2 size={11} />Approved
                    </span>
                  ) : (
                    <span className="vp-badge" style={{ background: "#fefce8", color: "#92400e" }}>
                      <Clock size={11} />Pending
                    </span>
                  )}
                  <Link href={`/vendor/products/${p.id}`} className="vp-view-btn">
                    View <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
