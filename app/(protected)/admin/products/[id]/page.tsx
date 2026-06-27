"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, IndianRupee, Leaf, Truck, Building2 } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

const LISTING_TYPES = ["Product", "Service"];
const AVAILABILITY   = ["B2B", "B2C"];
const PRICE_TYPES    = ["Fixed Price", "Starts From", "Price on Request"];
const SHIP_REGIONS   = ["Local Only", "Countrywide", "Regional", "Worldwide"];

export default function AdminEditProductPage() {
  const { id }   = useParams();
  const router   = useRouter();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const [categories,    setCategories]    = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tags,          setTags]          = useState<any[]>([]);
  const [vendors,       setVendors]       = useState<any[]>([]);

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [listingType,       setListingType]       = useState("");
  const [title,             setTitle]             = useState("");
  const [categoryId,        setCategoryId]        = useState("");
  const [subCategoryId,     setSubCategoryId]     = useState("");
  const [description,       setDescription]       = useState("");
  const [existingImages,    setExistingImages]    = useState<string[]>([]);
  const [newImages,         setNewImages]         = useState<File[]>([]);
  const [coverIndex,        setCoverIndex]        = useState(0);

  const [availableFor,       setAvailableFor]       = useState<string[]>([]);
  const [priceType,          setPriceType]          = useState("");
  const [price,              setPrice]              = useState("");
  const [currency,           setCurrency]           = useState("INR");
  const [moq,                setMoq]                = useState("");
  const [discount,           setDiscount]           = useState("");

  const [selectedTags,         setSelectedTags]         = useState<string[]>([]);
  const [sustainabilityClaim,  setSustainabilityClaim]  = useState("");

  const [shipRegions, setShipRegions] = useState<string[]>([]);
  const [inStock,     setInStock]     = useState(true);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      try {
        const res = await fetch(`/api/admin/products/${id}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error?.message || "Unable to load product.");
        const p = payload.product;
        setListingType(Array.isArray(p.listingType) ? p.listingType[0] : p.listingType || "");
        setSelectedVendorId(p.vendorId || "");
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
        setSelectedTags(p.sustainabilityTagIds || p.sustainabilityTags || []);
        setSustainabilityClaim(p.sustainabilityClaim || "");
        setShipRegions(p.shipRegions || []);
        setInStock(p.inStock ?? true);
        setCategories(payload.masters?.categories || []);
        setSubCategories(payload.masters?.subCategories || []);
        setTags(payload.masters?.tags || []);
        setVendors(payload.masters?.vendors || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load product.");
      } finally { setLoading(false); }
    }
    load();
  }, [id, router]);

  function toggle(list: string[], value: string, setter: any, max?: number) {
    setter((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((v: string) => v !== value)
        : max && prev.length >= max ? prev : [...prev, value],
    );
  }

  const filteredSubCats = subCategories.filter(s => s.categoryId === categoryId);
  const allImages       = [...existingImages, ...newImages];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorId) { alert("Please select a vendor"); return; }
    setSaving(true);
    setError("");
    try {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      const uploadedImages = await Promise.all(
        newImages.map(file => uploadFileToSupabaseStorage(file, { bucket: "marketplace", folder: "products", accessToken: session.accessToken })),
      );
      const combined       = [...existingImages, ...uploadedImages.map(img => img.url)];
      const orderedImages  = [combined[coverIndex], ...combined.filter((_, i) => i !== coverIndex)].filter(Boolean);
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          listingType, title, description,
          categoryId, subCategoryId,
          images: orderedImages,
          availableFor, priceType, price, currency, moq, discount,
          sustainabilityTagIds: selectedTags,
          sustainabilityClaim, shipRegions, inStock,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Update failed");
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 30, height: 30, border: "4px solid #dcfce7", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        .ape-page{display:flex;flex-direction:column;gap:18px;padding-bottom:48px}
        .ape-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .ape-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ape-hero-inner{position:relative;z-index:1;display:flex;align-items:center;gap:14px}
        .ape-back{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.1);color:#fff;border:none;cursor:pointer;flex-shrink:0;transition:background .15s}
        .ape-back:hover{background:rgba(255,255,255,.18)}
        .ape-hero-title{font-size:20px;font-weight:900;color:#fff;margin:0 0 2px;letter-spacing:-.025em}
        .ape-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}

        .ape-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .ape-card-head{padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:12px}
        .ape-card-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ape-card-title{font-size:14px;font-weight:800;color:#111;margin:0}
        .ape-card-body{padding:20px;display:flex;flex-direction:column;gap:16px}

        .ape-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
        .ape-input{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .ape-input:focus{border-color:#16a34a}
        .ape-textarea{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;resize:none;transition:border .15s}
        .ape-textarea:focus{border-color:#16a34a}
        .ape-select{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;box-sizing:border-box;transition:border .15s}
        .ape-select:focus{border-color:#16a34a}
        .ape-help{font-size:11.5px;color:#9ca3af;margin:4px 0 0}

        .ape-chips{display:flex;gap:8px;flex-wrap:wrap}
        .ape-chip{padding:7px 14px;border-radius:50px;font-size:12.5px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
        .ape-chip.on{background:#f0fdf4;color:#15803d;border-color:#16a34a}

        .ape-upload{display:flex;justify-content:center;align-items:center;border:2px dashed rgba(0,0,0,.12);border-radius:14px;padding:20px 16px;font-size:13px;color:#9ca3af;cursor:pointer;transition:all .15s;text-align:center}
        .ape-upload:hover{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
        .ape-preview{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:4px}
        .ape-preview-item{position:relative;border-radius:12px;overflow:hidden;border:2px solid rgba(0,0,0,.08)}
        .ape-preview-item.cover{border-color:#16a34a}
        .ape-preview-img{width:100%;height:90px;object-fit:cover;display:block}
        .ape-cover-badge{position:absolute;top:5px;left:5px;font-size:9px;font-weight:800;background:#16a34a;color:#fff;padding:2px 7px;border-radius:50px}
        .ape-new-badge{position:absolute;top:5px;right:5px;font-size:9px;font-weight:800;background:#3b82f6;color:#fff;padding:2px 7px;border-radius:50px}
        .ape-preview-bar{position:absolute;inset-x:0;bottom:0;background:rgba(0,0,0,.6);display:flex;justify-content:space-between;padding:4px 6px}
        .ape-set-cover{font-size:10px;color:#fff;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}
        .ape-remove{font-size:10px;color:#fca5a5;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}

        .ape-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .ape-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        .ape-checkbox{display:flex;align-items:center;gap:9px;font-size:13px;color:#374151;cursor:pointer}
        .ape-checkbox input{width:16px;height:16px;accent-color:#16a34a;cursor:pointer}

        .ape-submit-row{display:flex;justify-content:flex-end;gap:12px}
        .ape-cancel{padding:11px 22px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit}
        .ape-cancel:hover{background:#f9fafb}
        .ape-submit{display:inline-flex;align-items:center;gap:8px;padding:11px 28px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(22,163,74,.3);transition:all .15s}
        .ape-submit:hover:not(:disabled){background:#15803d}
        .ape-submit:disabled{opacity:.6;cursor:not-allowed}
        .ape-spinner{width:14px;height:14px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:ape-spin .7s linear infinite;flex-shrink:0}
        @keyframes ape-spin{to{transform:rotate(360deg)}}

        .ape-err{background:#fef2f2;border:1px solid rgba(220,38,38,.12);border-radius:14px;padding:12px 16px;font-size:13px;color:#dc2626}
      `}</style>

      <div className="ape-page">

        {/* Hero */}
        <div className="ape-hero">
          <div className="ape-hero-inner">
            <button className="ape-back" onClick={() => router.push("/admin/products")}><ArrowLeft size={16} /></button>
            <div>
              <h1 className="ape-hero-title">Edit Product</h1>
              <p className="ape-hero-sub">Update listing details for a vendor</p>
            </div>
          </div>
        </div>

        {error && <div className="ape-err">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Vendor Assignment */}
          <div className="ape-card">
            <div className="ape-card-head">
              <div className="ape-card-icon" style={{ background: "#ede9fe" }}><Building2 size={17} color="#7c3aed" /></div>
              <p className="ape-card-title">Vendor Assignment</p>
            </div>
            <div className="ape-card-body">
              <div>
                <p className="ape-label">Select Vendor *</p>
                <select className="ape-select" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} required>
                  <option value="">Select a vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName || v.name || v.id}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="ape-card">
            <div className="ape-card-head">
              <div className="ape-card-icon" style={{ background: "#eff6ff" }}><Package size={17} color="#3b82f6" /></div>
              <p className="ape-card-title">Basic Listing Info</p>
            </div>
            <div className="ape-card-body">
              <div>
                <p className="ape-label">Listing Type *</p>
                <div className="ape-chips">
                  {LISTING_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setListingType(t)} className={`ape-chip${listingType === t ? " on" : ""}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ape-label">Listing Title *</p>
                <input className="ape-input" placeholder="Eg: Recycled PET Fabric for Apparel" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="ape-2col">
                <div>
                  <p className="ape-label">Category *</p>
                  <select className="ape-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="ape-label">Subcategory *</p>
                  <select className="ape-select" value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} required>
                    <option value="">Select subcategory</option>
                    {filteredSubCats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="ape-label">Short Description *</p>
                <textarea className="ape-textarea" rows={4} maxLength={500} placeholder="What is this product, how does it help buyers, what makes it sustainable…" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <p className="ape-label">Add More Images</p>
                <label className="ape-upload">
                  <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => {
                    if (!e.target.files) return;
                    setNewImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5 - existingImages.length));
                    e.target.value = "";
                  }} />
                  {newImages.length === 0 ? "Click to upload new images" : newImages.map(f => f.name).join(", ")}
                </label>
                <p className="ape-help">Existing images can be removed. New selected files will be uploaded on save.</p>
              </div>
              {allImages.length > 0 && (
                <div className="ape-preview">
                  {allImages.map((fileOrUrl, i) => {
                    const isExisting = i < existingImages.length;
                    const url        = isExisting ? (fileOrUrl as string) : URL.createObjectURL(fileOrUrl as File);
                    return (
                      <div key={i} className={`ape-preview-item${coverIndex === i ? " cover" : ""}`}>
                        <img src={url} alt={`preview-${i}`} className="ape-preview-img" />
                        {coverIndex === i && <span className="ape-cover-badge">COVER</span>}
                        {!isExisting && <span className="ape-new-badge">NEW</span>}
                        <div className="ape-preview-bar">
                          <button type="button" className="ape-set-cover" onClick={() => setCoverIndex(i)}>Set Cover</button>
                          <button type="button" className="ape-remove" onClick={() => {
                            if (isExisting) {
                              setExistingImages(prev => prev.filter((_, j) => j !== i));
                            } else {
                              const ni = i - existingImages.length;
                              setNewImages(prev => prev.filter((_, j) => j !== ni));
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
          <div className="ape-card">
            <div className="ape-card-head">
              <div className="ape-card-icon" style={{ background: "#fefce8" }}><IndianRupee size={17} color="#ca8a04" /></div>
              <p className="ape-card-title">Commercial Info</p>
            </div>
            <div className="ape-card-body">
              <div>
                <p className="ape-label">Available For *</p>
                <div className="ape-chips">
                  {AVAILABILITY.map(a => (
                    <button key={a} type="button" onClick={() => toggle(availableFor, a, setAvailableFor)} className={`ape-chip${availableFor.includes(a) ? " on" : ""}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ape-label">Price Type *</p>
                <select className="ape-select" value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="">Select price type</option>
                  {PRICE_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {(priceType === "Fixed Price" || priceType === "Starts From") && (
                <div className="ape-3col">
                  <div>
                    <p className="ape-label">Price</p>
                    <input className="ape-input" type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <p className="ape-label">Currency</p>
                    <input className="ape-input" placeholder="INR" value={currency} onChange={e => setCurrency(e.target.value)} />
                  </div>
                  <div>
                    <p className="ape-label">MOQ</p>
                    <input className="ape-input" placeholder="Optional" value={moq} onChange={e => setMoq(e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <p className="ape-label">Discount / Offer</p>
                <input className="ape-input" placeholder="Eg: 10% off on bulk orders (optional)" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="ape-card">
            <div className="ape-card-head">
              <div className="ape-card-icon" style={{ background: "#f0fdf4" }}><Leaf size={17} color="#16a34a" /></div>
              <p className="ape-card-title">Sustainability</p>
            </div>
            <div className="ape-card-body">
              <div>
                <p className="ape-label">Sustainability Tags (max 3)</p>
                <div className="ape-chips">
                  {tags.map(t => (
                    <button key={t.id} type="button" onClick={() => toggle(selectedTags, t.id, setSelectedTags, 3)} className={`ape-chip${selectedTags.includes(t.id) ? " on" : ""}`}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ape-label">Sustainability Claim</p>
                <input className="ape-input" maxLength={100} placeholder="Eg: Made from 70% recycled PET" value={sustainabilityClaim} onChange={e => setSustainabilityClaim(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="ape-card">
            <div className="ape-card-head">
              <div className="ape-card-icon" style={{ background: "#faf5ff" }}><Truck size={17} color="#9333ea" /></div>
              <p className="ape-card-title">Logistics & Availability</p>
            </div>
            <div className="ape-card-body">
              <div>
                <p className="ape-label">Ships / Available To</p>
                <div className="ape-chips">
                  {SHIP_REGIONS.map(r => (
                    <button key={r} type="button" onClick={() => toggle(shipRegions, r, setShipRegions)} className={`ape-chip${shipRegions.includes(r) ? " on" : ""}`}>{r}</button>
                  ))}
                </div>
              </div>
              <label className="ape-checkbox">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                In stock and ready to supply
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="ape-submit-row">
            <button type="button" className="ape-cancel" onClick={() => router.push("/admin/products")}>Cancel</button>
            <button type="submit" className="ape-submit" disabled={saving}>
              {saving && <span className="ape-spinner" />}
              {saving ? "Updating…" : "Update Listing"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
