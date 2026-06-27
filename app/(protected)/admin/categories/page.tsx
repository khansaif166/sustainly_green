"use client";

import { useEffect, useState } from "react";
import { Layers, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Category = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  active: boolean;
};

export default function AdminCategoriesPage() {
  const [name,       setName]       = useState("");
  const [image,      setImage]      = useState<File | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId,  setEditingId]  = useState<string | null>(null);

  async function fetchCategories() {
    const session = getStoredSession();
    if (!session) return;
    const res = await fetch("/api/admin/master/categories", { headers: { Authorization: `Bearer ${session.accessToken}` } });
    const payload = await res.json();
    if (res.ok) setCategories(payload.items || []);
  }

  async function saveCategory() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const session = getStoredSession();
      if (!session) return;
      const body = { name, slug: name.toLowerCase().replace(/\s+/g, "-"), imageUrl: undefined };
      if (editingId) {
        await fetch(`/api/admin/master/categories/${editingId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/admin/master/categories", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, active: true }),
        });
      }
      resetForm();
      fetchCategories();
    } finally { setLoading(false); }
  }

  function resetForm() { setName(""); setImage(null); setEditingId(null); }
  function startEdit(c: Category) { setName(c.name); setEditingId(c.id); setImage(null); }

  async function toggleCategory(id: string, active: boolean) {
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/master/categories/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category permanently?")) return;
    const session = getStoredSession();
    if (!session) return;
    await fetch(`/api/admin/master/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  useEffect(() => { fetchCategories(); }, []);

  return (
    <>
      <style>{`
        .acc-page{display:flex;flex-direction:column;gap:18px;padding-bottom:40px}
        .acc-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .acc-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .acc-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
        .acc-hero-title{font-size:21px;font-weight:900;color:#fff;margin:0 0 3px;letter-spacing:-.025em}
        .acc-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}
        .acc-hero-stat-val{font-size:26px;font-weight:900;color:#4ade80;letter-spacing:-.03em;line-height:1;margin:0;text-align:right}
        .acc-hero-stat-label{font-size:10.5px;color:rgba(255,255,255,.3);margin:3px 0 0;font-weight:600;text-transform:uppercase;letter-spacing:.05em;text-align:right}

        .acc-form-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .acc-form-title{font-size:14px;font-weight:800;color:#111;margin:0 0 16px}
        .acc-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
        .acc-input{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .acc-input:focus{border-color:#16a34a}
        .acc-upload{display:flex;justify-content:center;align-items:center;border:2px dashed rgba(0,0,0,.1);border-radius:12px;padding:18px;font-size:13px;color:#9ca3af;cursor:pointer;transition:all .15s;text-align:center}
        .acc-upload:hover{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
        .acc-help{font-size:11px;color:#9ca3af;margin:4px 0 0}
        .acc-btns{display:flex;gap:10px;margin-top:16px}
        .acc-save{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(22,163,74,.2);transition:all .15s}
        .acc-save:hover:not(:disabled){background:#15803d}
        .acc-save:disabled{opacity:.6;cursor:not-allowed}
        .acc-cancel{padding:9px 18px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
        .acc-cancel:hover{background:#f9fafb}

        .acc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
        .acc-item{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,.04)}
        .acc-item-left{display:flex;align-items:center;gap:12px}
        .acc-item-img{width:44px;height:44px;border-radius:12px;object-fit:cover;border:1px solid rgba(0,0,0,.07)}
        .acc-item-name{font-size:13.5px;font-weight:700;color:#111;margin:0 0 3px}
        .acc-active-badge{display:inline-block;padding:2px 9px;border-radius:50px;font-size:11px;font-weight:700;background:#f0fdf4;color:#15803d}
        .acc-inactive-badge{display:inline-block;padding:2px 9px;border-radius:50px;font-size:11px;font-weight:700;background:#fef2f2;color:#dc2626}
        .acc-item-actions{display:flex;gap:8px;align-items:center}
        .acc-act-btn{display:inline-flex;align-items:center;gap:4px;padding:6px 11px;border-radius:50px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:inherit;border:1.5px solid transparent;transition:all .15s}
        .acc-act-edit{background:#eff6ff;color:#3b82f6;border-color:rgba(59,130,246,.15)}
        .acc-act-edit:hover{background:#dbeafe}
        .acc-act-toggle-on{background:#f0fdf4;color:#15803d;border-color:rgba(22,163,74,.15)}
        .acc-act-toggle-off{background:#fefce8;color:#92400e;border-color:rgba(245,158,11,.15)}
        .acc-act-del{width:30px;height:30px;padding:0;border-radius:50%;background:#fef2f2;color:#dc2626;border:1.5px solid rgba(220,38,38,.12)}
        .acc-act-del:hover{background:#fee2e2}

        .acc-empty{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:32px 24px;text-align:center;font-size:13.5px;color:#9ca3af}
      `}</style>

      <div className="acc-page">

        {/* Hero */}
        <div className="acc-hero">
          <div className="acc-hero-inner">
            <div>
              <h1 className="acc-hero-title">Categories</h1>
              <p className="acc-hero-sub">Manage product categories across the platform</p>
            </div>
            <div>
              <p className="acc-hero-stat-val">{categories.length}</p>
              <p className="acc-hero-stat-label">Total</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="acc-form-card">
          <p className="acc-form-title">{editingId ? "Edit Category" : "Add New Category"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <p className="acc-label">Category Name</p>
              <input className="acc-input" placeholder="Eg. Sustainable Packaging" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <p className="acc-label">Category Image</p>
              <label className="acc-upload">
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setImage(e.target.files?.[0] || null)} />
                {image ? image.name : "Click to upload image"}
              </label>
              <p className="acc-help">PNG, JPG up to 5MB</p>
            </div>
          </div>
          <div className="acc-btns">
            <button onClick={saveCategory} disabled={loading} className="acc-save">
              <Layers size={14} />{loading ? "Saving…" : editingId ? "Update Category" : "Add Category"}
            </button>
            {editingId && <button onClick={resetForm} className="acc-cancel">Cancel</button>}
          </div>
        </div>

        {/* List */}
        {categories.length === 0 ? (
          <div className="acc-empty">No categories yet. Add your first one above.</div>
        ) : (
          <div className="acc-grid">
            {categories.map(c => (
              <div key={c.id} className="acc-item">
                <div className="acc-item-left">
                  {c.imageUrl && <img src={c.imageUrl} alt={c.name} className="acc-item-img" />}
                  <div>
                    <p className="acc-item-name">{c.name}</p>
                    <span className={c.active ? "acc-active-badge" : "acc-inactive-badge"}>{c.active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <div className="acc-item-actions">
                  <button onClick={() => startEdit(c)} className="acc-act-btn acc-act-edit"><Pencil size={11} />Edit</button>
                  <button onClick={() => toggleCategory(c.id, c.active)} className={`acc-act-btn ${c.active ? "acc-act-toggle-on" : "acc-act-toggle-off"}`}>
                    {c.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    {c.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="acc-act-btn acc-act-del"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
