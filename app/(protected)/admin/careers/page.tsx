"use client";

import { useEffect, useState } from "react";
import { Briefcase, MapPin, Clock, ToggleRight, ToggleLeft, Pencil, X } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Job = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
};

const JOB_TYPES = [
  { value: "FULL_TIME",  label: "Full Time"  },
  { value: "PART_TIME",  label: "Part Time"  },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "REMOTE",     label: "Remote"     },
];

export default function AdminCareersPage() {
  const [jobs,      setJobs]      = useState<Job[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", department: "", location: "", type: "FULL_TIME", description: "",
  });

  async function loadJobs() {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch("/api/admin/careers", { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload?.error?.message || "Unable to load careers.");
    setJobs(payload.jobs || []);
  }

  async function submitJob() {
    if (!form.title || !form.description) return;
    setLoading(true); setError("");
    try {
      const session = getStoredSession();
      if (!session) throw new Error("Please sign in again.");
      if (editingId) {
        const res = await fetch(`/api/admin/careers/${editingId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to update career.");
      } else {
        const res = await fetch("/api/admin/careers", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, active: true }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to create career.");
      }
      setForm({ title: "", department: "", location: "", type: "FULL_TIME", description: "" });
      setEditingId(null);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save career.");
    } finally { setLoading(false); }
  }

  function editJob(job: Job) {
    setForm({ title: job.title, department: job.department, location: job.location, type: job.type, description: job.description });
    setEditingId(job.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleJob(id: string, active: boolean) {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch(`/api/admin/careers/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (!res.ok) return;
    setJobs(prev => prev.map(j => j.id === id ? { ...j, active: !active } : j));
  }

  useEffect(() => {
    loadJobs().catch(err => setError(err instanceof Error ? err.message : "Unable to load careers."));
  }, []);

  const ff = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <>
      <style>{`
        .acar-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .acar-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .acar-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .acar-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .acar-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .acar-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .acar-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0;text-align:right}
        .acar-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;text-align:right}

        .acar-form-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04);display:flex;flex-direction:column;gap:16px}
        .acar-form-head{display:flex;align-items:center;justify-content:space-between}
        .acar-form-title{font-size:14px;font-weight:800;color:#111;margin:0}
        .acar-form-sub{font-size:12.5px;color:#9ca3af;margin:2px 0 0}
        .acar-err{background:#fef2f2;border:1px solid rgba(220,38,38,.12);border-radius:12px;padding:10px 14px;font-size:13px;color:#dc2626}
        .acar-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .acar-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
        .acar-input{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .acar-input:focus{border-color:#16a34a}
        .acar-select{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;box-sizing:border-box;transition:border .15s}
        .acar-select:focus{border-color:#16a34a}
        .acar-textarea{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;resize:none;transition:border .15s}
        .acar-textarea:focus{border-color:#16a34a}
        .acar-form-foot{display:flex;justify-content:flex-end;gap:10px}
        .acar-cancel{padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit}
        .acar-submit{display:inline-flex;align-items:center;gap:6px;padding:9px 22px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(22,163,74,.2);transition:all .15s}
        .acar-submit:disabled{opacity:.6;cursor:not-allowed}

        .acar-jobs-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .acar-jobs-title{font-size:14px;font-weight:800;color:#111;margin:0 0 14px}
        .acar-jobs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
        .acar-job-item{border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
        .acar-job-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
        .acar-job-title{font-size:13.5px;font-weight:800;color:#111;margin:0}
        .acar-job-meta{font-size:11.5px;color:#9ca3af;margin:2px 0 0}
        .acar-active-badge{display:inline-block;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700;background:#f0fdf4;color:#15803d;flex-shrink:0}
        .acar-inactive-badge{display:inline-block;padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700;background:#f3f4f6;color:#6b7280;flex-shrink:0}
        .acar-job-desc{font-size:12.5px;color:#6b7280;margin:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
        .acar-job-foot{display:flex;justify-content:space-between;align-items:center}
        .acar-toggle-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#3b82f6;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}
        .acar-edit-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#374151;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}
        .acar-empty{font-size:13.5px;color:#9ca3af;text-align:center;padding:24px}
      `}</style>

      <div className="acar-page">

        {/* Hero */}
        <div className="acar-hero">
          <div className="acar-hero-inner">
            <div>
              <h1 className="acar-hero-title">Careers</h1>
              <p className="acar-hero-sub">Manage job openings displayed on the website</p>
            </div>
            <div>
              <p className="acar-stat-val">{jobs.length}</p>
              <p className="acar-stat-label">Postings</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="acar-form-card">
          <div className="acar-form-head">
            <div>
              <p className="acar-form-title">{editingId ? "Edit Job Opening" : "Add Job Opening"}</p>
              <p className="acar-form-sub">{editingId ? "Update the existing career opportunity" : "Create and publish a new career opportunity"}</p>
            </div>
          </div>
          {error && <div className="acar-err">{error}</div>}
          <div className="acar-2col">
            <div>
              <p className="acar-label">Job Title</p>
              <input className="acar-input" placeholder="Frontend Developer" value={form.title} onChange={ff("title")} />
            </div>
            <div>
              <p className="acar-label">Department</p>
              <input className="acar-input" placeholder="Engineering, Sales…" value={form.department} onChange={ff("department")} />
            </div>
            <div>
              <p className="acar-label">Location</p>
              <input className="acar-input" placeholder="Remote / Bengaluru" value={form.location} onChange={ff("location")} />
            </div>
            <div>
              <p className="acar-label">Job Type</p>
              <select className="acar-select" value={form.type} onChange={ff("type")}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="acar-label">Job Description</p>
            <textarea className="acar-textarea" rows={5} value={form.description} onChange={ff("description")} placeholder="Describe the role, responsibilities, and requirements…" />
          </div>
          <div className="acar-form-foot">
            {editingId && (
              <button className="acar-cancel" onClick={() => { setEditingId(null); setForm({ title: "", department: "", location: "", type: "FULL_TIME", description: "" }); }}>
                <X size={13} style={{ display: "inline", marginRight: 4 }} />Cancel
              </button>
            )}
            <button onClick={submitJob} disabled={loading} className="acar-submit">
              <Briefcase size={13} />{loading ? "Saving…" : editingId ? "Update Job" : "Post Job"}
            </button>
          </div>
        </div>

        {/* Jobs list */}
        <div className="acar-jobs-card">
          <p className="acar-jobs-title">Posted Jobs</p>
          {jobs.length === 0 ? (
            <div className="acar-empty">No job postings yet.</div>
          ) : (
            <div className="acar-jobs-grid">
              {jobs.map(j => (
                <div key={j.id} className="acar-job-item">
                  <div className="acar-job-head">
                    <div>
                      <p className="acar-job-title">{j.title}</p>
                      <p className="acar-job-meta">
                        <MapPin size={10} style={{ display: "inline", marginRight: 3 }} />{j.location}
                        {" · "}<Clock size={10} style={{ display: "inline", marginRight: 3 }} />{j.type.replace("_", " ")}
                        {j.department && ` · ${j.department}`}
                      </p>
                    </div>
                    <span className={j.active ? "acar-active-badge" : "acar-inactive-badge"}>{j.active ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="acar-job-desc">{j.description}</p>
                  <div className="acar-job-foot">
                    <button onClick={() => toggleJob(j.id, j.active)} className="acar-toggle-btn">
                      {j.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {j.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => editJob(j)} className="acar-edit-btn">
                      <Pencil size={12} />Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
