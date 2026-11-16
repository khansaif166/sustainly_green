"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";

type Category = { id: string; name: string };
type Subcategory = { id: string; name: string; categoryId: string };
type ProductType = { id: string; name: string; subcategoryId: string; active: boolean };

export default function AdminProductTypesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const session = getStoredSession();
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.accessToken}` };
    const [c, s, t] = await Promise.all([
      fetch("/api/admin/master/categories", { headers }),
      fetch("/api/admin/master/subcategories", { headers }),
      fetch("/api/admin/master/product-types", { headers }),
    ]);
    if (!c.ok || !s.ok || !t.ok) throw new Error("Unable to load the catalog.");
    const [cats, subs, productTypes] = await Promise.all([c.json(), s.json(), t.json()]);
    setCategories(cats.items || []);
    setSubcategories(subs.items || []);
    setTypes(productTypes.items || []);
  }, []);

  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);

  async function mutate(method: string, path: string, body?: Record<string, unknown>) {
    const session = getStoredSession();
    if (!session) throw new Error("Please sign in again.");
    const response = await fetch(path, {
      method,
      headers: { Authorization: `Bearer ${session.accessToken}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error?.message || "Unable to save product type.");
  }

  function reset() { setEditing(null); setName(""); setSubcategoryId(""); setCategoryId(""); }

  async function save() {
    if (!name.trim() || !subcategoryId) { setError("Choose a subcategory and enter a name."); return; }
    setBusy(true); setError("");
    try {
      await mutate(editing ? "PATCH" : "POST", editing ? `/api/admin/master/product-types/${editing.id}` : "/api/admin/master/product-types", { name: name.trim(), subcategoryId });
      reset(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save product type."); }
    finally { setBusy(false); }
  }

  async function toggle(item: ProductType) {
    setBusy(true); setError("");
    try { await mutate("PATCH", `/api/admin/master/product-types/${item.id}`, { active: !item.active }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to update product type."); }
    finally { setBusy(false); }
  }

  async function remove(item: ProductType) {
    if (!confirm(`Delete ${item.name}? Types already used by products cannot be deleted.`)) return;
    setBusy(true); setError("");
    try { await mutate("DELETE", `/api/admin/master/product-types/${item.id}`); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to delete product type."); }
    finally { setBusy(false); }
  }

  function edit(item: ProductType) {
    const sub = subcategories.find(s => s.id === item.subcategoryId);
    setEditing(item); setName(item.name); setSubcategoryId(item.subcategoryId);
    setCategoryId(sub?.categoryId || ""); setError("");
  }

  return <div className="apt-page">
    <style>{`
      .apt-page{display:flex;flex-direction:column;gap:18px;width:100%;min-width:0;padding-bottom:40px}
      .apt-hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 26px;border-radius:22px;background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%)}
      .apt-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18),transparent 65%);pointer-events:none}
      .apt-hero-copy,.apt-stat{position:relative}
      .apt-page .apt-title{margin:0 0 5px;font-size:21px;font-weight:900;line-height:1.3;letter-spacing:-.025em;color:#fff}
      .apt-page .apt-subtitle{margin:0;font-size:13px;line-height:1.6;color:#b2c6b9}
      .apt-stat{flex-shrink:0;text-align:right}
      .apt-page .apt-stat-value{margin:0;font-size:26px;font-weight:900;line-height:1;letter-spacing:-.03em;color:#4ade80}
      .apt-page .apt-stat-label{margin:5px 0 0;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b2c6b9}
      .apt-panel{min-width:0;border:1px solid rgba(0,0,0,.07);border-radius:20px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.04)}
      .apt-form-panel{padding:20px}
      .apt-page .apt-section-title{margin:0;font-size:14px;font-weight:800;line-height:1.5;color:#17251d}
      .apt-form-panel .apt-section-title{margin-bottom:16px}
      .apt-form-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) auto;gap:12px;align-items:end}
      .apt-field{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:11px;font-weight:700;line-height:1.5;letter-spacing:.04em;text-transform:uppercase;color:#374151}
      .apt-page .apt-control{width:100%;min-width:0;height:40px;box-sizing:border-box;padding:9px 12px;border:1.5px solid #dce4df;border-radius:12px;outline:none;background:#fff;font-family:inherit;font-size:13px;font-weight:500;line-height:1.4;letter-spacing:normal;text-transform:none;color:#17251d;transition:border-color .15s,box-shadow .15s}
      .apt-page select.apt-control{padding-right:28px;cursor:pointer}
      .apt-page .apt-control:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.1)}
      .apt-page .apt-control:disabled{background:#f5f7f6;color:#84908a;cursor:not-allowed}
      .apt-page .apt-control::placeholder{color:#8a9690}
      .apt-form-actions{display:flex;align-items:center;gap:8px;min-height:40px}
      .apt-page .apt-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex-shrink:0;box-sizing:border-box;border:1px solid transparent;border-radius:50px;font-family:inherit;font-size:12px;font-weight:700;line-height:1.4;white-space:nowrap;cursor:pointer;transition:background .15s,border-color .15s,box-shadow .15s}
      .apt-button svg{flex-shrink:0}
      .apt-page .apt-button:focus-visible{outline:2px solid #15803d;outline-offset:3px}
      .apt-page .apt-button:disabled{opacity:.5;cursor:not-allowed}
      .apt-page .apt-primary{height:40px;padding:9px 18px;background:#16a34a;color:#fff;box-shadow:0 2px 8px rgba(22,163,74,.18)}
      .apt-page .apt-primary:hover:not(:disabled){background:#15803d}
      .apt-page .apt-cancel{height:40px;padding:9px 15px;border-color:#dce4df;background:#fff;color:#53645a}
      .apt-page .apt-cancel:hover{background:#f5f7f6}
      .apt-error{margin:0;padding:12px 16px;border:1px solid #fecaca;border-radius:12px;background:#fef2f2;font-size:13px;line-height:1.6;color:#991b1b;overflow-wrap:anywhere}
      .apt-table-heading{display:flex;align-items:center;gap:9px;padding:18px 20px;border-bottom:1px solid #eaf0ec}
      .apt-table-heading>svg{flex-shrink:0;color:#52715e}
      .apt-count{display:inline-flex;align-items:center;justify-content:center;min-width:24px;padding:2px 7px;border:1px solid #e2eae5;border-radius:50px;background:#f5f8f6;font-size:11px;font-weight:700;color:#53645a}
      .apt-table-scroll{max-width:100%;overflow-x:auto;border-radius:0 0 20px 20px}
      .apt-table-scroll:focus-visible{outline:2px solid #16a34a;outline-offset:-2px}
      .apt-table{width:100%;min-width:820px;table-layout:fixed;border-collapse:collapse;text-align:left}
      .apt-table .apt-col-name{width:auto}
      .apt-table .apt-col-category{width:19%}
      .apt-table .apt-col-subcategory{width:19%}
      .apt-table .apt-col-status{width:110px}
      .apt-table .apt-col-actions{width:260px}
      .apt-table thead{background:#f7f9f8}
      .apt-table th{padding:12px 20px;font-size:10.5px;font-weight:700;line-height:1.5;letter-spacing:.055em;text-transform:uppercase;color:#64756b}
      .apt-table td{padding:16px 20px;border-top:1px solid #edf1ee;font-size:13px;line-height:1.6;vertical-align:middle;color:#5c6b62;overflow-wrap:anywhere}
      .apt-table tbody tr:hover{background:#fafcfb}
      .apt-table td.apt-name{font-weight:700;color:#17251d}
      .apt-status{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border:1px solid transparent;border-radius:50px;font-size:11px;font-weight:700;line-height:1.5;white-space:nowrap}
      .apt-status::before{content:'';width:5px;height:5px;flex-shrink:0;border-radius:50%;background:currentColor}
      .apt-status-active{border-color:#dcfce7;background:#f0fdf4;color:#15803d}
      .apt-status-inactive{border-color:#e2e8e4;background:#f3f5f4;color:#66766c}
      .apt-table .apt-actions-cell{text-align:right}
      .apt-row-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px}
      .apt-page .apt-edit,.apt-page .apt-toggle{min-height:32px;padding:6px 10px;font-size:11px}
      .apt-page .apt-edit{border-color:#dbeafe;background:#eff6ff;color:#2563eb}
      .apt-page .apt-edit:hover:not(:disabled){background:#dbeafe}
      .apt-page .apt-toggle{border-color:#fde68a;background:#fffbeb;color:#92400e}
      .apt-page .apt-toggle:hover:not(:disabled){background:#fef3c7}
      .apt-page .apt-activate{border-color:#bbf7d0;background:#f0fdf4;color:#15803d}
      .apt-page .apt-activate:hover:not(:disabled){background:#dcfce7}
      .apt-page .apt-delete{width:32px;height:32px;flex:0 0 32px;padding:0;border-color:#fecaca;background:#fef2f2;color:#dc2626}
      .apt-page .apt-delete:hover:not(:disabled){background:#fee2e2}
      .apt-table td.apt-empty{padding:40px 20px;text-align:center;color:#7d8c83}
      @media(max-width:1023px){.apt-form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:639px){.apt-hero{padding:20px;gap:12px}.apt-page .apt-title{font-size:20px}.apt-page .apt-subtitle{font-size:12px}.apt-form-panel{padding:18px}.apt-form-grid{grid-template-columns:minmax(0,1fr)}.apt-form-actions{margin-top:2px}.apt-table-heading{padding:16px 18px}}
    `}</style>
    <header className="apt-hero">
      <div className="apt-hero-copy">
        <h1 className="apt-title">Product types</h1>
        <p className="apt-subtitle">Manage the third level under each subcategory.</p>
      </div>
      <div className="apt-stat">
        <p className="apt-stat-value">{types.length}</p>
        <p className="apt-stat-label">Total</p>
      </div>
    </header>
    {error && <p role="alert" className="apt-error">{error}</p>}
    <section className="apt-panel apt-form-panel" aria-labelledby="apt-form-title">
      <h2 id="apt-form-title" className="apt-section-title">{editing ? "Edit product type" : "Add product type"}</h2>
      <div className="apt-form-grid">
        <label className="apt-field">Category
          <select className="apt-control" value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(""); }}>
            <option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="apt-field">Subcategory
          <select className="apt-control" value={subcategoryId} disabled={!categoryId} onChange={e => setSubcategoryId(e.target.value)}>
            <option value="">Select subcategory</option>{subcategories.filter(s => s.categoryId === categoryId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="apt-field">Product type name
          <input className="apt-control" value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="e.g. Bamboo bottle" />
        </label>
        <div className="apt-form-actions">
          <button type="button" className="apt-button apt-primary" disabled={busy} onClick={save}>
            {editing ? <Pencil size={13} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
            {editing ? "Update" : "Add"}
          </button>
          {editing && <button type="button" className="apt-button apt-cancel" onClick={reset}>Cancel</button>}
        </div>
      </div>
    </section>
    <section className="apt-panel" aria-labelledby="apt-table-title">
      <div className="apt-table-heading">
        <Package size={16} aria-hidden="true" />
        <h2 id="apt-table-title" className="apt-section-title">All product types</h2>
        <span className="apt-count">{types.length}</span>
      </div>
      <div className="apt-table-scroll" role="region" aria-label="Product types table" tabIndex={0}>
        <table className="apt-table" aria-labelledby="apt-table-title">
          <colgroup>
            <col className="apt-col-name" /><col className="apt-col-category" /><col className="apt-col-subcategory" /><col className="apt-col-status" /><col className="apt-col-actions" />
          </colgroup>
          <thead><tr>
            <th scope="col">Name</th><th scope="col">Category</th><th scope="col">Subcategory</th><th scope="col">Status</th><th scope="col" className="apt-actions-cell">Actions</th>
          </tr></thead>
          <tbody>
            {types.length === 0 && <tr><td colSpan={5} className="apt-empty">No product types yet. Add your first one above.</td></tr>}
            {types.map(item => {
              const sub = subcategories.find(s => s.id === item.subcategoryId);
              const cat = categories.find(c => c.id === sub?.categoryId);
              return <tr key={item.id}>
                <td className="apt-name">{item.name}</td>
                <td>{cat?.name || "Unknown category"}</td>
                <td>{sub?.name || "Unknown subcategory"}</td>
                <td><span className={`apt-status ${item.active ? "apt-status-active" : "apt-status-inactive"}`}>{item.active ? "Active" : "Inactive"}</span></td>
                <td className="apt-actions-cell"><div className="apt-row-actions">
                  <button type="button" disabled={busy} className="apt-button apt-edit" onClick={() => edit(item)} aria-label={`Edit ${item.name}`}>
                    <Pencil size={12} aria-hidden="true" />Edit
                  </button>
                  <button type="button" disabled={busy} className={`apt-button apt-toggle${item.active ? "" : " apt-activate"}`} onClick={() => toggle(item)} aria-label={`${item.active ? "Deactivate" : "Activate"} ${item.name}`}>
                    {item.active ? <ToggleRight size={14} aria-hidden="true" /> : <ToggleLeft size={14} aria-hidden="true" />}
                    {item.active ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" disabled={busy} className="apt-button apt-delete" onClick={() => remove(item)} aria-label={`Delete ${item.name}`} title={`Delete ${item.name}`}>
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>
  </div>;
}
