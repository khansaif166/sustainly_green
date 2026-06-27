"use client";

import { useEffect, useState } from "react";
import { Tag, Pencil, Trash2 } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type TagType = { id: string; name: string; active: boolean };

export default function AdminTagsPage() {
  const [name,      setName]      = useState("");
  const [tags,      setTags]      = useState<TagType[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch("/api/admin/master/tags", { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const payload = await res.json();
    if (res.ok) setTags(payload.items || []);
  }

  async function saveTag() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const session = getStoredSession();
      if (!session) return;
      if (editingId) {
        await fetch(`/api/admin/master/tags/${editingId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      } else {
        await fetch("/api/admin/master/tags", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name, active: true }),
        });
      }
      resetForm();
      load();
    } finally { setLoading(false); }
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag permanently?")) return;
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/master/tags/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    setTags(prev => prev.filter(t => t.id !== id));
  }

  function startEdit(t: TagType) { setName(t.name); setEditingId(t.id); }
  function resetForm() { setName(""); setEditingId(null); }

  useEffect(() => { load(); }, []);

  return (
    <>
      <style>{`
        .atg-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .atg-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .atg-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .atg-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .atg-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .atg-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .atg-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0;text-align:right}
        .atg-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;text-align:right}

        .atg-form-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .atg-form-title{font-size:14px;font-weight:800;color:#111;margin:0 0 14px}
        .atg-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .atg-input{flex:1;min-width:200px;padding:10px 14px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;color:#111;transition:border .15s}
        .atg-input:focus{border-color:#16a34a}
        .atg-save{padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(22,163,74,.2);white-space:nowrap;transition:all .15s}
        .atg-save:disabled{opacity:.6;cursor:not-allowed}
        .atg-cancel{padding:10px 18px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit;white-space:nowrap}

        .atg-list-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .atg-list-title{font-size:14px;font-weight:800;color:#111;margin:0 0 14px}
        .atg-chips{display:flex;flex-wrap:wrap;gap:10px}
        .atg-chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:50px;background:#f0fdf4;border:1.5px solid rgba(22,163,74,.12);font-size:13px;font-weight:600;color:#15803d}
        .atg-chip-name{color:#15803d}
        .atg-chip-hash{color:rgba(22,163,74,.5);font-size:11px}
        .atg-chip-btns{display:flex;gap:5px;margin-left:3px}
        .atg-chip-edit{display:inline-flex;align-items:center;background:rgba(59,130,246,.1);color:#3b82f6;border:none;border-radius:6px;padding:3px;cursor:pointer;transition:all .15s}
        .atg-chip-edit:hover{background:rgba(59,130,246,.2)}
        .atg-chip-del{display:inline-flex;align-items:center;background:rgba(220,38,38,.08);color:#dc2626;border:none;border-radius:6px;padding:3px;cursor:pointer;transition:all .15s}
        .atg-chip-del:hover{background:rgba(220,38,38,.15)}
        .atg-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:32px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
      `}</style>

      <div className="atg-page">

        {/* Hero */}
        <div className="atg-hero">
          <div className="atg-hero-inner">
            <div>
              <h1 className="atg-hero-title">Tags</h1>
              <p className="atg-hero-sub">Manage sustainability tags for products and listings</p>
            </div>
            <div>
              <p className="atg-stat-val">{tags.length}</p>
              <p className="atg-stat-label">Total</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="atg-form-card">
          <p className="atg-form-title">{editingId ? "Edit Tag" : "Add Tag"}</p>
          <div className="atg-row">
            <input className="atg-input" placeholder="Tag name (e.g. Eco Friendly)" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveTag()} />
            <button onClick={saveTag} disabled={loading} className="atg-save">
              <Tag size={13} style={{ display: "inline", marginRight: 6 }} />{loading ? "Saving…" : editingId ? "Update Tag" : "Add Tag"}
            </button>
            {editingId && <button onClick={resetForm} className="atg-cancel">Cancel</button>}
          </div>
        </div>

        {/* Tag chips */}
        {tags.length === 0 ? (
          <div className="atg-empty">No tags yet. Add your first one above.</div>
        ) : (
          <div className="atg-list-card">
            <p className="atg-list-title">All Tags</p>
            <div className="atg-chips">
              {tags.map(t => (
                <span key={t.id} className="atg-chip">
                  <span className="atg-chip-hash">#</span>
                  <span className="atg-chip-name">{t.name}</span>
                  <span className="atg-chip-btns">
                    <button className="atg-chip-edit" onClick={() => startEdit(t)}><Pencil size={11} /></button>
                    <button className="atg-chip-del" onClick={() => deleteTag(t.id)}><Trash2 size={11} /></button>
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
