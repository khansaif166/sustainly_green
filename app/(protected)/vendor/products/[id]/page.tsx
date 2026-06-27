"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";
import {
  ArrowLeft, Package, IndianRupee, Leaf, Truck, ImagePlus,
  X, CheckCircle2, Loader2,
} from "lucide-react";

const LISTING_TYPES = ["Product", "Service"];
const AVAILABILITY  = ["B2B", "B2C"];
const PRICE_TYPES   = ["Fixed Price", "Starts From", "Price on Request"];
const SHIP_REGIONS  = ["Local Only", "Countrywide", "Regional", "Worldwide"];

export default function EditProductPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [saved,   setSaved]   = useState(false);

  const [categories,    setCategories]    = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tags,          setTags]          = useState<any[]>([]);

  const [listingType,        setListingType]        = useState("");
  const [title,              setTitle]              = useState("");
  const [categoryId,         setCategoryId]         = useState("");
  const [subCategoryId,      setSubCategoryId]      = useState("");
  const [description,        setDescription]        = useState("");
  const [existingImages,     setExistingImages]     = useState<string[]>([]);
  const [newImages,          setNewImages]          = useState<File[]>([]);
  const [coverIndex,         setCoverIndex]         = useState(0);
  const [availableFor,       setAvailableFor]       = useState<string[]>([]);
  const [priceType,          setPriceType]          = useState("");
  const [price,              setPrice]              = useState("");
  const [currency,           setCurrency]           = useState("INR");
  const [moq,                setMoq]                = useState("");
  const [discount,           setDiscount]           = useState("");
  const [selectedTags,       setSelectedTags]       = useState<string[]>([]);
  const [sustainabilityClaim,setSustainabilityClaim]= useState("");
  const [shipRegions,        setShipRegions]        = useState<string[]>([]);
  const [inStock,            setInStock]            = useState(true);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const authHeader = { Authorization: `Bearer ${session.accessToken}` };
        const [pr, catalogRes] = await Promise.all([
          fetch(`/api/vendor/products/${id}`, { headers: authHeader }),
          fetch("/api/vendor/catalog", { headers: authHeader }),
        ]);
        const pp = await pr.json();
        if (!pr.ok) throw new Error(pp?.error?.message || "Unable to load product.");
        const p = pp.product;
        setListingType(Array.isArray(p.listingType) ? p.listingType[0] : p.listingType || "");
        setTitle(p.title || "");
        setCategoryId(p.categoryId || "");
        setSubCategoryId(p.subCategoryId || "");
        setDescription(p.description || "");
        setExistingImages(p.images || []);
        setAvailableFor(p.availableFor || []);
        setPriceType(p.priceType || "");
        setPrice(p.price?.toString() || "");
        setCurrency(p.currency || "INR");
        setMoq(p.moq?.toString() || "");
        setDiscount(p.discount || "");
        setSelectedTags(p.sustainabilityTagIds || []);
        setSustainabilityClaim(p.sustainabilityClaim || "");
        setShipRegions(p.shipRegions || []);
        setInStock(p.inStock ?? true);
        if (catalogRes.ok) {
          const catalog = await catalogRes.json();
          setCategories(catalog.categories || []);
          setSubCategories(catalog.subcategories || []);
          setTags(catalog.tags || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load product.");
      } finally { setLoading(false); }
    }
    load();
  }, [id, router]);

  function toggle(list: string[], value: string, setter: any, max?: number) {
    setter((prev: string[]) =>
      prev.includes(value) ? prev.filter(v => v !== value) : max && prev.length >= max ? prev : [...prev, value]
    );
  }

  const filteredSubs = subCategories.filter(s => s.categoryId === categoryId);
  const allImages    = [...existingImages, ...newImages];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const session = getStoredSession();
    if (!session) { router.push("/login"); return; }
    setSaving(true); setError("");
    try {
      const uploaded   = await Promise.all(newImages.map(f => uploadFileToSupabaseStorage(f, { bucket: "marketplace", folder: "products", accessToken: session.accessToken })));
      const uploadUrls = uploaded.map(u => u.url);
      const combined   = [...existingImages, ...uploadUrls];
      const ordered    = [combined[coverIndex], ...combined.filter((_, i) => i !== coverIndex)].filter(Boolean);
      const res = await fetch(`/api/vendor/products/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingType, title, description, categoryId, subCategoryId, images: ordered, availableFor, priceType, price, currency, moq, discount, sustainabilityTagIds: selectedTags, sustainabilityClaim, shipRegions, inStock }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Update failed.");
      setSaved(true);
      setTimeout(() => router.push("/vendor/products"), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <div style={{ width: 28, height: 28, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (saved) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 size={32} color="#16a34a" />
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Changes saved!</p>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Redirecting to your products…</p>
    </div>
  );

  return (
    <>
      <style>{`
        .ep-page{display:flex;flex-direction:column;gap:20px;padding-bottom:40px;max-width:800px}
        .ep-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .ep-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 350px 220px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ep-hero-inner{position:relative;z-index:1}
        .ep-back{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:rgba(255,255,255,.45);text-decoration:none;margin-bottom:12px;transition:color .15s}
        .ep-back:hover{color:rgba(255,255,255,.8)}
        .ep-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.025em}
        .ep-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}

        .ep-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .ep-card-head{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid #f3f4f6}
        .ep-card-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ep-card-title{font-size:13.5px;font-weight:800;color:#111;margin:0}
        .ep-card-body{padding:18px 20px;display:flex;flex-direction:column;gap:14px}

        .ep-field{display:flex;flex-direction:column;gap:5px}
        .ep-label{font-size:12.5px;font-weight:700;color:#374151}
        .ep-help{font-size:11.5px;color:#9ca3af;margin:2px 0 0}
        .ep-input{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;transition:border .15s;box-sizing:border-box;color:#111}
        .ep-input:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.08)}
        .ep-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}
        .ep-textarea{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;transition:border .15s;resize:none;box-sizing:border-box;color:#111}
        .ep-textarea:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.08)}
        .ep-select{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;transition:border .15s;appearance:none;cursor:pointer;color:#111}
        .ep-select:focus{border-color:#16a34a}
        .ep-select:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}

        .ep-chips{display:flex;gap:8px;flex-wrap:wrap}
        .ep-chip{padding:7px 14px;border-radius:50px;font-size:12.5px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;font-family:inherit;transition:all .15s;color:#374151}
        .ep-chip:hover{border-color:#16a34a;color:#16a34a}
        .ep-chip.on{background:#f0fdf4;color:#15803d;border-color:#16a34a;font-weight:700}

        .ep-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:2px dashed rgba(0,0,0,.12);border-radius:14px;padding:24px;cursor:pointer;transition:all .15s;text-align:center}
        .ep-upload:hover{border-color:#16a34a;background:#f0fdf4}
        .ep-upload-label{font-size:13px;font-weight:600;color:#374151}
        .ep-upload-sub{font-size:11.5px;color:#9ca3af}

        .ep-img-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
        @media(max-width:500px){.ep-img-grid{grid-template-columns:repeat(3,1fr)}}
        .ep-img-wrap{position:relative;border-radius:12px;overflow:hidden;border:2px solid rgba(0,0,0,.1)}
        .ep-img-wrap.cover{border-color:#16a34a;border-width:2.5px}
        .ep-img-thumb{height:88px;width:100%;object-fit:cover;display:block}
        .ep-img-actions{position:absolute;inset-x:0;bottom:0;display:flex;justify-content:space-between;background:rgba(0,0,0,.6);padding:4px 6px}
        .ep-img-btn{font-size:10px;font-weight:700;border:none;background:none;cursor:pointer;font-family:inherit;padding:0}

        .ep-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:500px){.ep-grid2{grid-template-columns:1fr}}
        .ep-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        @media(max-width:500px){.ep-grid3{grid-template-columns:1fr}}

        .ep-checkbox-row{display:flex;align-items:center;gap:10px;cursor:pointer}
        .ep-checkbox{width:18px;height:18px;border-radius:6px;border:2px solid rgba(0,0,0,.15);appearance:none;cursor:pointer;position:relative;flex-shrink:0;transition:all .15s}
        .ep-checkbox:checked{background:#16a34a;border-color:#16a34a}
        .ep-checkbox:checked::after{content:'';position:absolute;left:4px;top:1px;width:6px;height:10px;border:2px solid #fff;border-left:none;border-top:none;transform:rotate(45deg)}

        .ep-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .ep-cancel{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#6b7280;text-decoration:none;transition:all .15s}
        .ep-cancel:hover{background:#f9fafb}
        .ep-submit{display:inline-flex;align-items:center;gap:7px;padding:11px 28px;border-radius:50px;font-size:13.5px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:0 4px 16px rgba(22,163,74,.3)}
        .ep-submit:hover:not(:disabled){background:#15803d}
        .ep-submit:disabled{opacity:.55;cursor:not-allowed}
        .ep-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ep-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}
        .ep-new-badge{position:absolute;top:4px;right:4px;background:#3b82f6;color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:50px}
      `}</style>

      <div className="ep-page">

        {/* Hero */}
        <div className="ep-hero">
          <div className="ep-hero-inner">
            <Link href="/vendor/products" className="ep-back"><ArrowLeft size={13} />My Products</Link>
            <h1 className="ep-hero-title">Edit Product / Service</h1>
            <p className="ep-hero-sub">Changes will be reviewed before going live.</p>
          </div>
        </div>

        {error && <div className="ep-err">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Basic Info */}
          <div className="ep-card">
            <div className="ep-card-head">
              <div className="ep-card-icon" style={{ background: "#eff6ff" }}><Package size={17} color="#3b82f6" /></div>
              <p className="ep-card-title">Basic Listing Info</p>
            </div>
            <div className="ep-card-body">

              <div className="ep-field">
                <span className="ep-label">Listing Type</span>
                <div className="ep-chips">
                  {LISTING_TYPES.map(t => (
                    <button key={t} type="button" className={`ep-chip${listingType === t ? " on" : ""}`} onClick={() => setListingType(t)}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="ep-field">
                <span className="ep-label">Listing Title *</span>
                <input className="ep-input" placeholder="e.g. Recycled PET Fabric for Apparel" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} required />
                <span className="ep-help">{title.length}/120 characters</span>
              </div>

              <div className="ep-grid2">
                <div className="ep-field">
                  <span className="ep-label">Category *</span>
                  <select className="ep-select" value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(""); }} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ep-field">
                  <span className="ep-label">Subcategory *</span>
                  <select className="ep-select" value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} required>
                    <option value="">Select subcategory</option>
                    {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="ep-field">
                <span className="ep-label">Short Description *</span>
                <textarea className="ep-textarea" rows={4} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} />
                <span className="ep-help">{description.length}/500 characters</span>
              </div>

              <div className="ep-field">
                <span className="ep-label">Add More Images <span style={{ color: "#9ca3af", fontWeight: 500 }}>(max 5 total)</span></span>
                <label className="ep-upload">
                  <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => {
                    if (!e.target.files) return;
                    setNewImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5 - existingImages.length));
                    e.target.value = "";
                  }} />
                  <ImagePlus size={24} color="#9ca3af" />
                  <span className="ep-upload-label">Click to upload new images</span>
                  <span className="ep-upload-sub">Existing images are shown below</span>
                </label>
              </div>

              {allImages.length > 0 && (
                <div className="ep-img-grid">
                  {allImages.map((fileOrUrl, i) => {
                    const isExisting = i < existingImages.length;
                    const src = isExisting ? (fileOrUrl as string) : URL.createObjectURL(fileOrUrl as File);
                    return (
                      <div key={i} className={`ep-img-wrap${coverIndex === i ? " cover" : ""}`}>
                        <img src={src} alt="" className="ep-img-thumb" />
                        {coverIndex === i && <span style={{ position: "absolute", top: 4, left: 4, background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 50 }}>COVER</span>}
                        {!isExisting && <span className="ep-new-badge">NEW</span>}
                        <div className="ep-img-actions">
                          <button type="button" className="ep-img-btn" style={{ color: "#fff" }} onClick={() => setCoverIndex(i)}>Cover</button>
                          <button type="button" className="ep-img-btn" style={{ color: "#fca5a5" }} onClick={() => {
                            if (isExisting) {
                              setExistingImages(prev => prev.filter((_, idx) => idx !== i));
                            } else {
                              setNewImages(prev => prev.filter((_, idx) => idx !== (i - existingImages.length)));
                            }
                            if (coverIndex === i) setCoverIndex(0);
                            else if (coverIndex > i) setCoverIndex(coverIndex - 1);
                          }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Commercial */}
          <div className="ep-card">
            <div className="ep-card-head">
              <div className="ep-card-icon" style={{ background: "#fefce8" }}><IndianRupee size={17} color="#f59e0b" /></div>
              <p className="ep-card-title">Commercial Info</p>
            </div>
            <div className="ep-card-body">

              <div className="ep-field">
                <span className="ep-label">Available For</span>
                <div className="ep-chips">
                  {AVAILABILITY.map(a => (
                    <button key={a} type="button" className={`ep-chip${availableFor.includes(a) ? " on" : ""}`} onClick={() => toggle(availableFor, a, setAvailableFor)}>{a}</button>
                  ))}
                </div>
              </div>

              <div className="ep-field">
                <span className="ep-label">Price Type</span>
                <select className="ep-select" value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="">Select price type</option>
                  {PRICE_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {(priceType === "Fixed Price" || priceType === "Starts From") && (
                <div className="ep-grid3">
                  <div className="ep-field">
                    <span className="ep-label">Price</span>
                    <input className="ep-input" type="number" placeholder="e.g. 5000" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div className="ep-field">
                    <span className="ep-label">Currency</span>
                    <select className="ep-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="ep-field">
                    <span className="ep-label">MOQ</span>
                    <input className="ep-input" placeholder="Min order qty" value={moq} onChange={e => setMoq(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="ep-field">
                <span className="ep-label">Discount / Offer <span style={{ color: "#9ca3af", fontWeight: 500 }}>(optional)</span></span>
                <input className="ep-input" placeholder="e.g. 10% off on orders above ₹50,000" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="ep-card">
            <div className="ep-card-head">
              <div className="ep-card-icon" style={{ background: "#f0fdf4" }}><Leaf size={17} color="#16a34a" /></div>
              <p className="ep-card-title">Sustainability</p>
            </div>
            <div className="ep-card-body">
              <div className="ep-field">
                <span className="ep-label">Sustainability Tags <span style={{ color: "#9ca3af", fontWeight: 500 }}>(max 3)</span></span>
                <div className="ep-chips">
                  {tags.map(t => (
                    <button key={t.id} type="button" className={`ep-chip${selectedTags.includes(t.id) ? " on" : ""}`} onClick={() => toggle(selectedTags, t.id, setSelectedTags, 3)}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div className="ep-field">
                <span className="ep-label">Key Sustainability Claim</span>
                <input className="ep-input" maxLength={100} placeholder="e.g. Made from 70% recycled PET bottles" value={sustainabilityClaim} onChange={e => setSustainabilityClaim(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="ep-card">
            <div className="ep-card-head">
              <div className="ep-card-icon" style={{ background: "#faf5ff" }}><Truck size={17} color="#9333ea" /></div>
              <p className="ep-card-title">Logistics &amp; Availability</p>
            </div>
            <div className="ep-card-body">
              <div className="ep-field">
                <span className="ep-label">Ships / Available To</span>
                <div className="ep-chips">
                  {SHIP_REGIONS.map(r => (
                    <button key={r} type="button" className={`ep-chip${shipRegions.includes(r) ? " on" : ""}`} onClick={() => toggle(shipRegions, r, setShipRegions)}>{r}</button>
                  ))}
                </div>
              </div>
              <label className="ep-checkbox-row">
                <input type="checkbox" className="ep-checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>In stock and ready to supply</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="ep-footer">
            <Link href="/vendor/products" className="ep-cancel"><X size={14} />Cancel</Link>
            <button type="submit" className="ep-submit" disabled={saving}>
              {saving ? <div className="ep-spinner" /> : <Loader2 size={14} style={{ display: "none" }} />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
