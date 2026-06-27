"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, X, Ban, CheckCircle2, ChevronLeft, ChevronRight, Users, ShieldCheck, ShoppingCart, Building2 } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type UserType = {
  id: string;
  email: string;
  role: "ADMIN" | "VENDOR" | "BUYER";
  blocked?: boolean;
};

const ROLE_META: Record<string, { bg: string; color: string }> = {
  ADMIN:  { bg: "#faf5ff", color: "#9333ea" },
  VENDOR: { bg: "#eff6ff", color: "#3b82f6" },
  BUYER:  { bg: "#f0fdf4", color: "#16a34a" },
};

export default function AdminUsers() {
  const [users,   setUsers]   = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState<"ALL" | "ADMIN" | "VENDOR" | "BUYER">("ALL");
  const [page,    setPage]    = useState(1);
  const pageSize = 10;

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { setLoading(false); return; }
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const payload = await res.json();
      if (res.ok) setUsers(payload.users || []);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleBlock(user: UserType) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ blocked: !user.blocked }) });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: !u.blocked } : u));
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = u.email?.toLowerCase().includes(q);
      const matchRole   = role === "ALL" || u.role === role;
      return matchSearch && matchRole;
    });
  }, [users, search, role]);

  const totalPages    = Math.ceil(filtered.length / pageSize);
  const paginated     = filtered.slice((page - 1) * pageSize, page * pageSize);
  const admins        = users.filter(u => u.role === "ADMIN").length;
  const vendors       = users.filter(u => u.role === "VENDOR").length;
  const buyers        = users.filter(u => u.role === "BUYER").length;

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .au-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .au-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .au-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .au-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
        .au-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .au-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .au-hero-stats{display:flex;gap:20px}
        .au-hero-stat{text-align:right}
        .au-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0}
        .au-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em}

        .au-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
        .au-kpi{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:10px;box-shadow:0 2px 6px rgba(0,0,0,.04)}
        .au-kpi-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .au-kpi-val{font-size:20px;font-weight:900;color:#111;margin:0;line-height:1}
        .au-kpi-label{font-size:11px;color:#6b7280;margin:2px 0 0;font-weight:600}

        .au-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .au-search{position:relative;flex:1;min-width:200px}
        .au-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .au-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .au-search input:focus{border-color:#16a34a}
        .au-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111}
        .au-select:focus{border-color:#16a34a}
        .au-clear{display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:12px;font-size:12.5px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#6b7280;cursor:pointer;font-family:inherit}
        .au-clear:hover{background:#f9fafb}

        .au-table-wrap{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .au-table{width:100%;border-collapse:collapse;font-size:13px;min-width:520px}
        .au-table th{text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#fafafa}
        .au-table td{padding:11px 16px;border-bottom:1px solid #f9fafb;vertical-align:middle;color:#374151}
        .au-table tr:last-child td{border-bottom:none}
        .au-table tr:hover td{background:#fafafa}
        .au-avatar{width:34px;height:34px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#16a34a;flex-shrink:0}
        .au-role-badge{display:inline-flex;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700}
        .au-action{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:50px;font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;border:1.5px solid transparent;transition:all .15s}

        .au-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid #f3f4f6}
        .au-page-btn{width:32px;height:32px;border-radius:10px;border:1.5px solid rgba(0,0,0,.1);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
        .au-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .au-page-btn:not(:disabled):hover{background:#f0fdf4;border-color:#16a34a}
      `}</style>

      <div className="au-page">

        {/* Hero */}
        <div className="au-hero">
          <div className="au-hero-inner">
            <div>
              <h1 className="au-hero-title">Users</h1>
              <p className="au-hero-sub">Manage all registered buyers, vendors and admins</p>
            </div>
            <div className="au-hero-stats">
              <div className="au-hero-stat">
                <p className="au-hero-stat-val">{users.length}</p>
                <p className="au-hero-stat-label">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="au-kpis">
          <div className="au-kpi">
            <div className="au-kpi-icon" style={{ background: "#faf5ff" }}><ShieldCheck size={16} color="#9333ea" /></div>
            <div><p className="au-kpi-val">{admins}</p><p className="au-kpi-label">Admins</p></div>
          </div>
          <div className="au-kpi">
            <div className="au-kpi-icon" style={{ background: "#eff6ff" }}><Building2 size={16} color="#3b82f6" /></div>
            <div><p className="au-kpi-val">{vendors}</p><p className="au-kpi-label">Vendors</p></div>
          </div>
          <div className="au-kpi">
            <div className="au-kpi-icon" style={{ background: "#f0fdf4" }}><ShoppingCart size={16} color="#16a34a" /></div>
            <div><p className="au-kpi-val">{buyers}</p><p className="au-kpi-label">Buyers</p></div>
          </div>
          <div className="au-kpi">
            <div className="au-kpi-icon" style={{ background: "#fef2f2" }}><Ban size={16} color="#ef4444" /></div>
            <div><p className="au-kpi-val">{users.filter(u => u.blocked).length}</p><p className="au-kpi-label">Blocked</p></div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="au-bar">
          <div className="au-search">
            <Search size={14} color="#9ca3af" className="au-search-icon" />
            <input placeholder="Search by email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="au-select" value={role} onChange={e => { setRole(e.target.value as any); setPage(1); }}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="BUYER">Buyer</option>
            <option value="VENDOR">Vendor</option>
          </select>
          {(search || role !== "ALL") && (
            <button className="au-clear" onClick={() => { setSearch(""); setRole("ALL"); setPage(1); }}>
              <X size={13} />Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="au-table-wrap" style={{ overflowX: "auto" }}>
          <table className="au-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "#9ca3af", padding: "28px 16px" }}>No users found.</td></tr>
              )}
              {paginated.map(u => {
                const roleMeta  = ROLE_META[u.role] || { bg: "#f3f4f6", color: "#6b7280" };
                const initials  = u.email.slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="au-avatar">{initials}</div>
                        <span style={{ fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="au-role-badge" style={{ background: roleMeta.bg, color: roleMeta.color }}>{u.role}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: u.blocked ? "#dc2626" : "#16a34a" }}>
                        {u.blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => toggleBlock(u)} className="au-action"
                        style={u.blocked
                          ? { background: "#f0fdf4", color: "#16a34a", borderColor: "rgba(22,163,74,.15)" }
                          : { background: "#fef2f2", color: "#dc2626", borderColor: "rgba(220,38,38,.15)" }
                        }>
                        {u.blocked ? <CheckCircle2 size={13} /> : <Ban size={13} />}
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="au-pagination">
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>{filtered.length} users · Page {page} of {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="au-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={15} />
                </button>
                <button className="au-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
