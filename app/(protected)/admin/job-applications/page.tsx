"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, Search, Briefcase, Mail, Phone, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type JobApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone?: string;
  resumeURL: string;
  createdAt?: any;
};

export default function AdminJobApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [jobFilter,    setJobFilter]    = useState("ALL");
  const [page,         setPage]         = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { setLoading(false); return; }
      const res = await fetch("/api/admin/job-applications", { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const payload = await res.json();
      if (res.ok) setApplications(payload.applications || []);
      setLoading(false);
    }
    load();
  }, []);

  async function deleteApplication(id: string) {
    if (!confirm("Delete this application permanently?")) return;
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/job-applications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    if (!res.ok) return;
    setApplications(prev => prev.filter(a => a.id !== id));
  }

  const filtered = useMemo(() => applications.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q);
    const matchJob    = jobFilter === "ALL" || a.jobTitle === jobFilter;
    return matchSearch && matchJob;
  }), [applications, search, jobFilter]);

  const totalPages     = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const uniqueJobTitles = [...new Set(applications.map(a => a.jobTitle))];

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .aja-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .aja-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .aja-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .aja-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .aja-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .aja-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .aja-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0;text-align:right}
        .aja-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;text-align:right}

        .aja-bar{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:18px;padding:14px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
        .aja-search{position:relative;flex:1;min-width:200px}
        .aja-search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none}
        .aja-search input{width:100%;padding:9px 12px 9px 34px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .aja-search input:focus{border-color:#16a34a}
        .aja-select{padding:9px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;min-width:160px}
        .aja-select:focus{border-color:#16a34a}

        .aja-table-wrap{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .aja-table{width:100%;border-collapse:collapse;font-size:13px;min-width:700px}
        .aja-table th{text-align:left;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;padding:12px 16px;border-bottom:1px solid #f3f4f6;background:#fafafa}
        .aja-table td{padding:11px 16px;border-bottom:1px solid #f9fafb;vertical-align:middle;color:#374151}
        .aja-table tr:last-child td{border-bottom:none}
        .aja-table tr:hover td{background:#fafafa}
        .aja-avatar{width:34px;height:34px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#16a34a;flex-shrink:0}
        .aja-job-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:#eff6ff;color:#3b82f6;border-radius:50px;font-size:11.5px;font-weight:700}
        .aja-date{font-size:11.5px;color:#9ca3af}
        .aja-dl-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;font-size:11.5px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;text-decoration:none;cursor:pointer;transition:all .15s}
        .aja-dl-btn:hover{background:#f0fdf4;border-color:#16a34a;color:#16a34a}
        .aja-dl-none{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;font-size:11.5px;font-weight:700;border:1.5px solid rgba(0,0,0,.06);background:#f9fafb;color:#9ca3af}
        .aja-del-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:50px;font-size:11.5px;font-weight:700;border:1.5px solid rgba(220,38,38,.12);background:#fef2f2;color:#dc2626;cursor:pointer;transition:all .15s}
        .aja-del-btn:hover{background:#fee2e2}

        .aja-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f3f4f6}
        .aja-page-btn{width:32px;height:32px;border-radius:10px;border:1.5px solid rgba(0,0,0,.1);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s}
        .aja-page-btn:disabled{opacity:.4;cursor:not-allowed}
        .aja-page-btn:not(:disabled):hover{background:#f0fdf4;border-color:#16a34a}
        .aja-empty{padding:36px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
      `}</style>

      <div className="aja-page">

        {/* Hero */}
        <div className="aja-hero">
          <div className="aja-hero-inner">
            <div>
              <h1 className="aja-hero-title">Job Applications</h1>
              <p className="aja-hero-sub">Review resumes submitted for career openings</p>
            </div>
            <div>
              <p className="aja-stat-val">{applications.length}</p>
              <p className="aja-stat-label">Total</p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="aja-bar">
          <div className="aja-search">
            <Search size={14} color="#9ca3af" className="aja-search-icon" />
            <input placeholder="Search by name, email, or job title…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="aja-select" value={jobFilter} onChange={e => { setJobFilter(e.target.value); setPage(1); }}>
            <option value="ALL">All Jobs</option>
            {uniqueJobTitles.map(job => <option key={job} value={job}>{job}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="aja-table-wrap" style={{ overflowX: "auto" }}>
          <table className="aja-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={6}><div className="aja-empty">No applications found.</div></td></tr>
              )}
              {paginated.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="aja-avatar">{a.name?.[0]?.toUpperCase() || "?"}</div>
                      <span style={{ fontWeight: 700, color: "#111" }}>{a.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="aja-job-chip"><Briefcase size={10} />{a.jobTitle}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Mail size={12} color="#9ca3af" />
                      <span style={{ fontSize: 12.5, color: "#6b7280" }}>{a.email}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Phone size={12} color="#9ca3af" />
                      <span>{a.phone || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Calendar size={12} color="#9ca3af" />
                      <span className="aja-date">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
                      {a.resumeURL
                        ? <a href={a.resumeURL} target="_blank" className="aja-dl-btn"><Download size={12} />Resume</a>
                        : <span className="aja-dl-none"><Download size={12} />Pending</span>
                      }
                      <button onClick={() => deleteApplication(a.id)} className="aja-del-btn"><Trash2 size={12} />Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="aja-pagination">
              <span style={{ fontSize: 12.5, color: "#6b7280" }}>{filtered.length} applications · Page {page} of {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="aja-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
                <button className="aja-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
