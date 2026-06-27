"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, X, Layers } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Category    = { id: string; name: string };
type SubCategory = { id: string; name: string; categoryId: string };

export default function AdminSubCategoriesPage() {
  const [name,       setName]       = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats,    setSubcats]    = useState<SubCategory[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [editing,    setEditing]    = useState<SubCategory | null>(null);

  async function load() {
    const session = getStoredSession();
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.accessToken}` };
    const [cRes, sRes] = await Promise.all([
      fetch("/api/admin/master/categories",    { headers }),
      fetch("/api/admin/master/subcategories", { headers }),
    ]);
    const [cPayload, sPayload] = await Promise.all([cRes.json(), sRes.json()]);
    if (cRes.ok) setCategories(cPayload.items || []);
    if (sRes.ok) setSubcats(sPayload.items || []);
  }

  async function save() {
    if (!name.trim() || !categoryId) return;
    setLoading(true);
    try {
      const session = getStoredSession();
      if (!session) return;
      if (editing) {
        await fetch(`/api/admin/master/subcategories/${editing.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name, categoryId }),
        });
      } else {
        await fetch("/api/admin/master/subcategories", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name, categoryId, active: true }),
        });
      }
      resetForm();
      load();
    } finally { setLoading(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this subcategory?")) return;
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/master/subcategories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    load();
  }

  function startEdit(sc: SubCategory) { setEditing(sc); setName(sc.name); setCategoryId(sc.categoryId); }
  function resetForm() { setName(""); setCategoryId(""); setEditing(null); }

  useEffect(() => { load(); }, []);

  const grouped = categories.map(c => ({
    category: c,
    items: subcats.filter(s => s.categoryId === c.id),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <style>{`
        .asc-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .asc-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .asc-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .asc-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .asc-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .asc-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .asc-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0;text-align:right}
        .asc-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;text-align:right}

        .asc-form-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .asc-form-title{font-size:14px;font-weight:800;color:#111;margin:0 0 16px}
        .asc-row{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end}
        .asc-field{display:flex;flex-direction:column;gap:5px}
        .asc-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em}
        .asc-input{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .asc-input:focus{border-color:#16a34a}
        .asc-select{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;box-sizing:border-box;transition:border .15s}
        .asc-select:focus{border-color:#16a34a}
        .asc-btns{display:flex;gap:8px}
        .asc-save{padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(22,163,74,.2);transition:all .15s;white-space:nowrap}
        .asc-save:disabled{opacity:.6;cursor:not-allowed}
        .asc-cancel{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(0,0,0,.1);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .asc-cancel:hover{background:#f9fafb}

        .asc-list-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .asc-section-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid #f3f4f6}
        .asc-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:20px}
        .asc-item{background:#f8faf9;border:1px solid rgba(0,0,0,.07);border-radius:12px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px}
        .asc-item-name{font-size:13px;font-weight:600;color:#111}
        .asc-item-actions{display:flex;gap:6px}
        .asc-act{display:inline-flex;align-items:center;padding:5px;border-radius:8px;border:none;cursor:pointer;transition:all .15s}
        .asc-act-edit{background:#eff6ff;color:#3b82f6}
        .asc-act-edit:hover{background:#dbeafe}
        .asc-act-del{background:#fef2f2;color:#dc2626}
        .asc-act-del:hover{background:#fee2e2}
        .asc-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:32px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
      `}</style>

      <div className="asc-page">

        {/* Hero */}
        <div className="asc-hero">
          <div className="asc-hero-inner">
            <div>
              <h1 className="asc-hero-title">Subcategories</h1>
              <p className="asc-hero-sub">Manage subcategories under each main category</p>
            </div>
            <div>
              <p className="asc-stat-val">{subcats.length}</p>
              <p className="asc-stat-label">Total</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="asc-form-card">
          <p className="asc-form-title">{editing ? "Edit Subcategory" : "Add Subcategory"}</p>
          <div className="asc-row">
            <div className="asc-field">
              <p className="asc-label">Parent Category</p>
              <select className="asc-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="asc-field">
              <p className="asc-label">Subcategory Name</p>
              <input className="asc-input" placeholder="Eg. Compostable Bags" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="asc-btns">
              <button onClick={save} disabled={loading} className="asc-save">
                {loading ? "Saving…" : editing ? "Update" : "Add"}
              </button>
              {editing && <button onClick={resetForm} className="asc-cancel"><X size={14} /></button>}
            </div>
          </div>
        </div>

        {/* List */}
        {subcats.length === 0 ? (
          <div className="asc-empty">No subcategories yet. Add your first one above.</div>
        ) : (
          <div className="asc-list-card">
            {grouped.length > 0 ? grouped.map(g => (
              <div key={g.category.id}>
                <p className="asc-section-label">{g.category.name}</p>
                <div className="asc-items">
                  {g.items.map(sc => (
                    <div key={sc.id} className="asc-item">
                      <span className="asc-item-name">{sc.name}</span>
                      <div className="asc-item-actions">
                        <button onClick={() => startEdit(sc)} className="asc-act asc-act-edit"><Pencil size={12} /></button>
                        <button onClick={() => remove(sc.id)} className="asc-act asc-act-del"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="asc-items">
                {subcats.map(sc => (
                  <div key={sc.id} className="asc-item">
                    <span className="asc-item-name">{sc.name}</span>
                    <div className="asc-item-actions">
                      <button onClick={() => startEdit(sc)} className="asc-act asc-act-edit"><Pencil size={12} /></button>
                      <button onClick={() => remove(sc.id)} className="asc-act asc-act-del"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
