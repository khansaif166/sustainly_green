"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, IndianRupee, Leaf, Truck, Building2 } from "lucide-react";
import { getStoredSession } from "@/lib/supabaseAuth";
import { uploadFileToSupabaseStorage } from "@/lib/storage";

const LISTING_TYPES = ["Product", "Service"];
const AVAILABILITY   = ["B2B", "B2C"];
const PRICE_TYPES    = ["Fixed Price", "Starts From", "Price on Request"];
const SHIP_REGIONS   = ["Local Only", "Countrywide", "Regional", "Worldwide"];

export default function AdminAddProductPage() {
  const router = useRouter();

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
  const [images,            setImages]            = useState<File[]>([]);
  const [coverIndex,        setCoverIndex]        = useState(0);

  const [availableFor,      setAvailableFor]      = useState<string[]>([]);
  const [priceType,         setPriceType]         = useState("");
  const [price,             setPrice]             = useState("");
  const [currency,          setCurrency]          = useState("INR");
  const [moq,               setMoq]               = useState("");
  const [discount,          setDiscount]          = useState("");

  const [selectedTags,      setSelectedTags]      = useState<string[]>([]);
  const [sustainabilityClaim, setSustainabilityClaim] = useState("");

  const [shipRegions, setShipRegions] = useState<string[]>([]);
  const [inStock,     setInStock]     = useState(true);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const session = getStoredSession();
    if (!session) router.push("/login");
  }, [router]);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session) return;
      const res = await fetch("/api/admin/products?masters=1", { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const payload = await res.json();
      if (res.ok) {
        setCategories(payload.masters?.categories || []);
        setSubCategories(payload.masters?.subCategories || []);
        setTags(payload.masters?.tags || []);
        setVendors(payload.masters?.vendors || []);
      }
    }
    load();
  }, []);

  function toggle(list: string[], value: string, setter: any, max?: number) {
    setter((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((v: string) => v !== value)
        : max && prev.length >= max ? prev : [...prev, value],
    );
  }

  const filteredSubCats = subCategories.filter(s => s.categoryId === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorId) { alert("Please select a vendor."); return; }
    setLoading(true);
    setError("");
    try {
      const session = getStoredSession();
      if (!session) { router.push("/login"); return; }
      const uploadedImages = await Promise.all(
        images.map(file => uploadFileToSupabaseStorage(file, { bucket: "marketplace", folder: "products", accessToken: session.accessToken })),
      );
      const imageUrls    = uploadedImages.map(img => img.url);
      const orderedImages = [imageUrls[coverIndex], ...imageUrls.filter((_, i) => i !== coverIndex)].filter(Boolean);
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          title, description, listingType, availableFor,
          categoryId, subCategoryId,
          images: orderedImages,
          priceType, price, currency, moq, discount,
          shipRegions, inStock,
          sustainabilityTagIds: selectedTags,
          sustainabilityClaim,
          approved: true,
          status: "APPROVED",
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Failed to create listing");
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally { setLoading(false); }
  }

  const uploadLabel = images.length === 0 ? "Click to upload images" : images.map(f => f.name).join(", ");

  return (
    <>
      <style>{`
        .apn-page{display:flex;flex-direction:column;gap:18px;padding-bottom:48px}
        .apn-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:22px 26px;position:relative;overflow:hidden}
        .apn-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 380px 230px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .apn-hero-inner{position:relative;z-index:1;display:flex;align-items:center;gap:14px}
        .apn-back{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.1);color:#fff;border:none;cursor:pointer;flex-shrink:0;transition:background .15s}
        .apn-back:hover{background:rgba(255,255,255,.18)}
        .apn-hero-title{font-size:20px;font-weight:900;color:#fff;margin:0 0 2px;letter-spacing:-.025em}
        .apn-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}

        .apn-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .apn-card-head{padding:16px 20px;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:12px}
        .apn-card-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .apn-card-title{font-size:14px;font-weight:800;color:#111;margin:0}
        .apn-card-body{padding:20px;display:flex;flex-direction:column;gap:16px}

        .apn-label{font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px}
        .apn-input{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;transition:border .15s}
        .apn-input:focus{border-color:#16a34a;background:#fff}
        .apn-textarea{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;box-sizing:border-box;color:#111;resize:none;transition:border .15s}
        .apn-textarea:focus{border-color:#16a34a}
        .apn-select{width:100%;padding:10px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;appearance:none;cursor:pointer;color:#111;box-sizing:border-box;transition:border .15s}
        .apn-select:focus{border-color:#16a34a}
        .apn-help{font-size:11.5px;color:#9ca3af;margin:4px 0 0}

        .apn-chips{display:flex;gap:8px;flex-wrap:wrap}
        .apn-chip{padding:7px 14px;border-radius:50px;font-size:12.5px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit;transition:all .15s}
        .apn-chip.on{background:#f0fdf4;color:#15803d;border-color:#16a34a}

        .apn-upload{display:flex;justify-content:center;align-items:center;border:2px dashed rgba(0,0,0,.12);border-radius:14px;padding:24px 16px;font-size:13px;color:#9ca3af;cursor:pointer;transition:all .15s;text-align:center}
        .apn-upload:hover{border-color:#16a34a;background:#f0fdf4;color:#16a34a}
        .apn-preview{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:4px}
        .apn-preview-item{position:relative;border-radius:12px;overflow:hidden;border:2px solid rgba(0,0,0,.08)}
        .apn-preview-item.cover{border-color:#16a34a}
        .apn-preview-img{width:100%;height:90px;object-fit:cover;display:block}
        .apn-cover-badge{position:absolute;top:5px;left:5px;font-size:9px;font-weight:800;background:#16a34a;color:#fff;padding:2px 7px;border-radius:50px}
        .apn-preview-bar{position:absolute;inset-x:0;bottom:0;background:rgba(0,0,0,.6);display:flex;justify-content:space-between;padding:4px 6px}
        .apn-set-cover{font-size:10px;color:#fff;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}
        .apn-remove{font-size:10px;color:#fca5a5;background:transparent;border:none;cursor:pointer;font-family:inherit;padding:0}

        .apn-2col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .apn-3col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
        .apn-checkbox{display:flex;align-items:center;gap:9px;font-size:13px;color:#374151;cursor:pointer}
        .apn-checkbox input{width:16px;height:16px;accent-color:#16a34a;cursor:pointer}

        .apn-submit-row{display:flex;justify-content:flex-end;gap:12px}
        .apn-cancel{padding:11px 22px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#374151;cursor:pointer;font-family:inherit}
        .apn-cancel:hover{background:#f9fafb}
        .apn-submit{display:inline-flex;align-items:center;gap:8px;padding:11px 28px;border-radius:50px;font-size:13px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(22,163,74,.3);transition:all .15s}
        .apn-submit:hover:not(:disabled){background:#15803d}
        .apn-submit:disabled{opacity:.6;cursor:not-allowed}
        .apn-spinner{width:14px;height:14px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:apn-spin .7s linear infinite;flex-shrink:0}
        @keyframes apn-spin{to{transform:rotate(360deg)}}

        .apn-err{background:#fef2f2;border:1px solid rgba(220,38,38,.12);border-radius:14px;padding:12px 16px;font-size:13px;color:#dc2626}
      `}</style>

      <div className="apn-page">

        {/* Hero */}
        <div className="apn-hero">
          <div className="apn-hero-inner">
            <button className="apn-back" onClick={() => router.push("/admin/products")}><ArrowLeft size={16} /></button>
            <div>
              <h1 className="apn-hero-title">Add Product</h1>
              <p className="apn-hero-sub">Create a product listing on behalf of a vendor</p>
            </div>
          </div>
        </div>

        {error && <div className="apn-err">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Vendor Assignment */}
          <div className="apn-card">
            <div className="apn-card-head">
              <div className="apn-card-icon" style={{ background: "#ede9fe" }}><Building2 size={17} color="#7c3aed" /></div>
              <p className="apn-card-title">Vendor Assignment</p>
            </div>
            <div className="apn-card-body">
              <div>
                <p className="apn-label">Select Vendor *</p>
                <select className="apn-select" value={selectedVendorId} onChange={e => setSelectedVendorId(e.target.value)} required>
                  <option value="">Select a vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName || v.name || v.id}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="apn-card">
            <div className="apn-card-head">
              <div className="apn-card-icon" style={{ background: "#eff6ff" }}><Package size={17} color="#3b82f6" /></div>
              <p className="apn-card-title">Basic Listing Info</p>
            </div>
            <div className="apn-card-body">
              <div>
                <p className="apn-label">Listing Type *</p>
                <div className="apn-chips">
                  {LISTING_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setListingType(t)} className={`apn-chip${listingType === t ? " on" : ""}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="apn-label">Listing Title *</p>
                <input className="apn-input" placeholder="Eg: Recycled PET Fabric for Apparel" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} required />
                <p className="apn-help">Max 120 characters</p>
              </div>
              <div className="apn-2col">
                <div>
                  <p className="apn-label">Category *</p>
                  <select className="apn-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <p className="apn-label">Subcategory *</p>
                  <select className="apn-select" value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} required>
                    <option value="">Select subcategory</option>
                    {filteredSubCats.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="apn-label">Short Description *</p>
                <textarea className="apn-textarea" rows={4} maxLength={500} placeholder="What is this product, how does it help buyers, what makes it sustainable…" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <p className="apn-label">Images</p>
                <label className="apn-upload">
                  <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => {
                    if (!e.target.files) return;
                    setImages(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                    e.target.value = "";
                  }} />
                  {uploadLabel}
                </label>
                <p className="apn-help">Upload up to 5 images. The cover image will be shown first.</p>
              </div>
              {images.length > 0 && (
                <div className="apn-preview">
                  {images.map((file, i) => {
                    const url = URL.createObjectURL(file);
                    return (
                      <div key={i} className={`apn-preview-item${coverIndex === i ? " cover" : ""}`}>
                        <img src={url} alt={`preview-${i}`} className="apn-preview-img" />
                        {coverIndex === i && <span className="apn-cover-badge">COVER</span>}
                        <div className="apn-preview-bar">
                          <button type="button" className="apn-set-cover" onClick={() => setCoverIndex(i)}>Set Cover</button>
                          <button type="button" className="apn-remove" onClick={() => { setImages(prev => prev.filter((_, j) => j !== i)); if (coverIndex === i) setCoverIndex(0); }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Commercial */}
          <div className="apn-card">
            <div className="apn-card-head">
              <div className="apn-card-icon" style={{ background: "#fefce8" }}><IndianRupee size={17} color="#ca8a04" /></div>
              <p className="apn-card-title">Commercial Info</p>
            </div>
            <div className="apn-card-body">
              <div>
                <p className="apn-label">Available For *</p>
                <div className="apn-chips">
                  {AVAILABILITY.map(a => (
                    <button key={a} type="button" onClick={() => toggle(availableFor, a, setAvailableFor)} className={`apn-chip${availableFor.includes(a) ? " on" : ""}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="apn-label">Price Type *</p>
                <select className="apn-select" value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="">Select price type</option>
                  {PRICE_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {(priceType === "Fixed Price" || priceType === "Starts From") && (
                <div className="apn-3col">
                  <div>
                    <p className="apn-label">Price</p>
                    <input className="apn-input" type="number" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <p className="apn-label">Currency</p>
                    <input className="apn-input" placeholder="INR" value={currency} onChange={e => setCurrency(e.target.value)} />
                  </div>
                  <div>
                    <p className="apn-label">MOQ</p>
                    <input className="apn-input" placeholder="Optional" value={moq} onChange={e => setMoq(e.target.value)} />
                  </div>
                </div>
              )}
              <div>
                <p className="apn-label">Discount / Offer</p>
                <input className="apn-input" placeholder="Eg: 10% off on bulk orders (optional)" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="apn-card">
            <div className="apn-card-head">
              <div className="apn-card-icon" style={{ background: "#f0fdf4" }}><Leaf size={17} color="#16a34a" /></div>
              <p className="apn-card-title">Sustainability</p>
            </div>
            <div className="apn-card-body">
              <div>
                <p className="apn-label">Sustainability Tags (max 3)</p>
                <div className="apn-chips">
                  {tags.map(t => (
                    <button key={t.id} type="button" onClick={() => toggle(selectedTags, t.id, setSelectedTags, 3)} className={`apn-chip${selectedTags.includes(t.id) ? " on" : ""}`}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="apn-label">Sustainability Claim</p>
                <input className="apn-input" maxLength={100} placeholder="Eg: Made from 70% recycled PET" value={sustainabilityClaim} onChange={e => setSustainabilityClaim(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="apn-card">
            <div className="apn-card-head">
              <div className="apn-card-icon" style={{ background: "#faf5ff" }}><Truck size={17} color="#9333ea" /></div>
              <p className="apn-card-title">Logistics & Availability</p>
            </div>
            <div className="apn-card-body">
              <div>
                <p className="apn-label">Ships / Available To</p>
                <div className="apn-chips">
                  {SHIP_REGIONS.map(r => (
                    <button key={r} type="button" onClick={() => toggle(shipRegions, r, setShipRegions)} className={`apn-chip${shipRegions.includes(r) ? " on" : ""}`}>{r}</button>
                  ))}
                </div>
              </div>
              <label className="apn-checkbox">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                In stock and ready to supply
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="apn-submit-row">
            <button type="button" className="apn-cancel" onClick={() => router.push("/admin/products")}>Cancel</button>
            <button type="submit" className="apn-submit" disabled={loading}>
              {loading && <span className="apn-spinner" />}
              {loading ? "Saving…" : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
