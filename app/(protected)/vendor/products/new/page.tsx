"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getValidSession } from "@/lib/supabaseAuth";
import ProductImagePicker from "@/app/components/product-images/ProductImagePicker";
import { useProductImages } from "@/app/components/product-images/useProductImages";
import ProductSpecificationsEditor from "@/app/components/product-specifications/ProductSpecificationsEditor";
import { useProductSpecifications } from "@/app/components/product-specifications/useProductSpecifications";
import { DESCRIPTION_MAX_CHARS, MIN_DESCRIPTION_WORDS, descriptionError } from "@/lib/productSeo";
import DescriptionWordHint from "@/app/components/DescriptionWordHint";
import {
  ArrowLeft, Package, IndianRupee, Leaf, Truck,
  X, CheckCircle2, Star,
} from "lucide-react";

const LISTING_TYPES = ["Product", "Service"];
const AVAILABILITY  = ["B2B", "B2C"];
const PRICE_TYPES   = ["Fixed Price", "Starts From", "Price on Request"];
const SHIP_REGIONS  = ["Local Only", "Countrywide", "Regional", "Worldwide"];

export default function AddProductPage() {
  const router = useRouter();

  const [categories,    setCategories]    = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tags,          setTags]          = useState<any[]>([]);

  const [listingType,        setListingType]        = useState("");
  const [title,              setTitle]              = useState("");
  const [categoryId,         setCategoryId]         = useState("");
  const [subCategoryId,      setSubCategoryId]      = useState("");
  const [description,        setDescription]        = useState("");
  const productImages = useProductImages();
  const productSpecifications = useProductSpecifications();
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
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState("");
  const [success,            setSuccess]            = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getValidSession();
      if (!session) { router.push("/login"); return; }
    })();
  }, [router]);

  useEffect(() => {
    async function load() {
      const session = await getValidSession();
      if (!session) return;
      const res = await fetch("/api/vendor/catalog", { headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories || []);
      setSubCategories(data.subcategories || []);
      setTags(data.tags || []);
    }
    load();
  }, []);

  function toggle(list: string[], value: string, setter: any, max?: number) {
    setter((prev: string[]) =>
      prev.includes(value) ? prev.filter(v => v !== value) : max && prev.length >= max ? prev : [...prev, value]
    );
  }

  const filteredSubs = subCategories.filter(s => s.categoryId === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (productImages.busy) return;
    const session = await getValidSession();
    if (!session) { router.push("/login"); return; }
    // Checked before uploading images so a short description doesn't cost an upload round-trip.
    const descriptionProblem = descriptionError(description);
    if (descriptionProblem) { setError(descriptionProblem); return; }
    setLoading(true); setError("");
    try {
      const specificationValues = productSpecifications.prepareForSave();
      const ordered = await productImages.uploadImages(session.accessToken);
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, listingType, availableFor, categoryId, subCategoryId, images: ordered, specifications: specificationValues, priceType, price, currency, moq, discount, shipRegions, inStock, sustainabilityTagIds: selectedTags, sustainabilityClaim }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message || "Failed to create listing.");
      setSuccess(true);
      setTimeout(() => router.push("/vendor/products"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing.");
    } finally { setLoading(false); }
  }

  if (success) return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 size={32} color="#16a34a" />
      </div>
      <p style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Listing submitted!</p>
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Your product is pending review. Redirecting…</p>
    </div>
  );

  return (
    <>
      <style>{`
        .ap-page{display:flex;flex-direction:column;gap:20px;padding-bottom:40px;max-width:800px}
        .ap-hero{background:linear-gradient(135deg,#0a1a10 0%,#0f2318 60%,#0c1e13 100%);border-radius:22px;padding:24px 28px;position:relative;overflow:hidden}
        .ap-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 350px 220px at 90% 50%,rgba(22,163,74,.18) 0%,transparent 65%);pointer-events:none}
        .ap-hero-inner{position:relative;z-index:1}
        .ap-back{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:rgba(255,255,255,.45);text-decoration:none;margin-bottom:12px;transition:color .15s}
        .ap-back:hover{color:rgba(255,255,255,.8)}
        .ap-hero-title{font-size:22px;font-weight:900;color:#fff;margin:0 0 4px;letter-spacing:-.025em}
        .ap-hero-sub{font-size:13px;color:rgba(255,255,255,.38);margin:0}

        .ap-card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:20px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.04)}
        .ap-card-head{display:flex;align-items:center;gap:12px;padding:18px 20px 14px;border-bottom:1px solid #f3f4f6}
        .ap-card-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ap-card-title{font-size:13.5px;font-weight:800;color:#111;margin:0}
        .ap-card-body{padding:18px 20px;display:flex;flex-direction:column;gap:14px}

        .ap-field{display:flex;flex-direction:column;gap:5px}
        .ap-label{font-size:12.5px;font-weight:700;color:#374151}
        .ap-help{font-size:11.5px;color:#9ca3af;margin:2px 0 0}
        .ap-input{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;transition:border .15s;box-sizing:border-box;color:#111}
        .ap-input:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.08)}
        .ap-input:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}
        .ap-textarea{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;transition:border .15s;resize:none;box-sizing:border-box;color:#111}
        .ap-textarea:focus{border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.08)}
        .ap-select{width:100%;padding:10px 13px;border:1.5px solid rgba(0,0,0,.1);border-radius:12px;font-size:13px;outline:none;font-family:inherit;background:#fff;transition:border .15s;appearance:none;cursor:pointer;color:#111}
        .ap-select:focus{border-color:#16a34a}
        .ap-select:disabled{background:#f9fafb;color:#9ca3af;cursor:not-allowed}

        .ap-chips{display:flex;gap:8px;flex-wrap:wrap}
        .ap-chip{padding:7px 14px;border-radius:50px;font-size:12.5px;font-weight:600;border:1.5px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;font-family:inherit;transition:all .15s;color:#374151}
        .ap-chip:hover{border-color:#16a34a;color:#16a34a}
        .ap-chip.on{background:#f0fdf4;color:#15803d;border-color:#16a34a;font-weight:700}



        .ap-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:500px){.ap-grid2{grid-template-columns:1fr}}
        .ap-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        @media(max-width:500px){.ap-grid3{grid-template-columns:1fr}}

        .ap-checkbox-row{display:flex;align-items:center;gap:10px;cursor:pointer}
        .ap-checkbox{width:18px;height:18px;border-radius:6px;border:2px solid rgba(0,0,0,.15);appearance:none;cursor:pointer;position:relative;flex-shrink:0;transition:all .15s}
        .ap-checkbox:checked{background:#16a34a;border-color:#16a34a}
        .ap-checkbox:checked::after{content:'';position:absolute;left:4px;top:1px;width:6px;height:10px;border:2px solid #fff;border-left:none;border-top:none;transform:rotate(45deg)}

        .ap-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .ap-cancel{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;border:1.5px solid rgba(0,0,0,.1);background:#fff;color:#6b7280;text-decoration:none;transition:all .15s}
        .ap-cancel:hover{background:#f9fafb}
        .ap-submit{display:inline-flex;align-items:center;gap:7px;padding:11px 28px;border-radius:50px;font-size:13.5px;font-weight:700;background:#16a34a;color:#fff;border:none;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:0 4px 16px rgba(22,163,74,.3)}
        .ap-submit:hover:not(:disabled){background:#15803d}
        .ap-submit:disabled{opacity:.55;cursor:not-allowed}
        .ap-spinner{width:15px;height:15px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* ---- Mobile (phones) ----
           Form controls sit at 16px because iOS Safari zooms the whole page
           when a focused field is smaller than that, and every tappable
           control clears the 44px minimum touch target. */
        @media(max-width:640px){
          .ap-page{gap:14px;padding-bottom:92px}
          .ap-hero{border-radius:18px;padding:20px 18px}
          .ap-hero-title{font-size:20px}
          .ap-hero-sub{font-size:12.5px}
          .ap-back{font-size:13.5px;min-height:44px;margin-bottom:6px}

          .ap-card{border-radius:16px}
          .ap-card-head{padding:16px 16px 12px}
          .ap-card-body{padding:16px;gap:18px}
          .ap-card-title{font-size:14.5px}

          .ap-label{font-size:13.5px}
          .ap-help{font-size:12.5px}
          .ap-input,.ap-textarea,.ap-select{font-size:16px;padding:13px 14px;border-radius:13px}
          .ap-select{min-height:50px;background-position:right 14px center}
          .ap-input{min-height:50px}

          .ap-chips{gap:9px}
          .ap-chip{min-height:44px;padding:11px 18px;font-size:14px;flex:1 1 auto}


          /* Two larger thumbnails beat five thumbnail-sized ones on a phone,
             and the per-image controls stay permanently visible since there
             is no hover to reveal them. */

          .ap-checkbox{width:24px;height:24px;border-radius:8px}
          .ap-checkbox:checked::after{left:7px;top:3px;width:6px;height:11px}
          .ap-checkbox-row{min-height:44px;font-size:14px}

          /* The form is ~2000px tall on a phone, so the actions ride along the
             bottom instead of stranding Save below four screens of scrolling. */
          .ap-footer{position:fixed;left:0;right:0;bottom:0;z-index:45;
            flex-wrap:nowrap;gap:10px;margin:0;
            padding:11px 16px calc(11px + env(safe-area-inset-bottom));
            background:rgba(255,255,255,.94);backdrop-filter:blur(10px);
            border-top:1px solid rgba(0,0,0,.07);box-shadow:0 -4px 18px rgba(0,0,0,.05)}
          .ap-cancel{flex:0 0 auto;min-height:50px;padding:0 20px;font-size:14px;justify-content:center}
          .ap-submit{flex:1 1 auto;min-height:50px;padding:0 20px;font-size:15px;justify-content:center}
        }

        @media(max-width:380px){
          .ap-chip{font-size:13.5px;padding:11px 14px}
        }

        .ap-err{background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px 16px;font-size:13px;color:#991b1b;font-weight:500}
      `}</style>

      <div className="ap-page">

        {/* Hero */}
        <div className="ap-hero">
          <div className="ap-hero-inner">
            <Link href="/vendor/products" className="ap-back"><ArrowLeft size={13} />My Products</Link>
            <h1 className="ap-hero-title">Add Product / Service</h1>
            <p className="ap-hero-sub">Your listing will be reviewed before going live.</p>
          </div>
        </div>

        {error && <div className="ap-err">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Basic Info */}
          <div className="ap-card">
            <div className="ap-card-head">
              <div className="ap-card-icon" style={{ background: "#eff6ff" }}><Package size={17} color="#3b82f6" /></div>
              <p className="ap-card-title">Basic Listing Info</p>
            </div>
            <div className="ap-card-body">

              <div className="ap-field">
                <span className="ap-label">Listing Type *</span>
                <div className="ap-chips">
                  {LISTING_TYPES.map(t => (
                    <button key={t} type="button" className={`ap-chip${listingType === t ? " on" : ""}`} onClick={() => setListingType(t)}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="ap-field">
                <span className="ap-label">Listing Title *</span>
                <input className="ap-input" placeholder="e.g. Recycled PET Fabric for Apparel" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} required />
                <span className="ap-help">{title.length}/120 characters</span>
              </div>

              <div className="ap-grid2">
                <div className="ap-field">
                  <span className="ap-label">Category *</span>
                  <select className="ap-select" value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(""); }} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ap-field">
                  <span className="ap-label">Subcategory *</span>
                  <select className="ap-select" value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} required>
                    <option value="">Select subcategory</option>
                    {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="ap-field">
                <span className="ap-label">Description * (min {MIN_DESCRIPTION_WORDS} words)</span>
                <textarea className="ap-textarea" rows={10} maxLength={DESCRIPTION_MAX_CHARS} placeholder={"What it is and what it's made of, sizes/variants, uses and who buys it, certifications, why it's sustainable, delivery areas and lead time.\n\nTip: end with 2–3 FAQs, e.g. \"Do you ship pan-India?\""} value={description} onChange={e => setDescription(e.target.value)} />
                <DescriptionWordHint value={description} />
              </div>

              <ProductImagePicker controller={productImages} disabled={loading} />
            </div>
          </div>

          {/* Specifications */}
          <ProductSpecificationsEditor controller={productSpecifications} disabled={loading || productImages.busy} />

          {/* Commercial */}
          <div className="ap-card">
            <div className="ap-card-head">
              <div className="ap-card-icon" style={{ background: "#fefce8" }}><IndianRupee size={17} color="#f59e0b" /></div>
              <p className="ap-card-title">Commercial Info</p>
            </div>
            <div className="ap-card-body">

              <div className="ap-field">
                <span className="ap-label">Available For *</span>
                <div className="ap-chips">
                  {AVAILABILITY.map(a => (
                    <button key={a} type="button" className={`ap-chip${availableFor.includes(a) ? " on" : ""}`} onClick={() => toggle(availableFor, a, setAvailableFor)}>{a}</button>
                  ))}
                </div>
              </div>

              <div className="ap-field">
                <span className="ap-label">Price Type *</span>
                <select className="ap-select" value={priceType} onChange={e => setPriceType(e.target.value)}>
                  <option value="">Select price type</option>
                  {PRICE_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {(priceType === "Fixed Price" || priceType === "Starts From") && (
                <div className="ap-grid3">
                  <div className="ap-field">
                    <span className="ap-label">Price</span>
                    <input className="ap-input" type="number" placeholder="e.g. 5000" value={price} onChange={e => setPrice(e.target.value)} />
                  </div>
                  <div className="ap-field">
                    <span className="ap-label">Currency</span>
                    <select className="ap-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="ap-field">
                    <span className="ap-label">MOQ</span>
                    <input className="ap-input" placeholder="Min order qty" value={moq} onChange={e => setMoq(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="ap-field">
                <span className="ap-label">Discount / Offer <span style={{ color: "#9ca3af", fontWeight: 500 }}>(optional)</span></span>
                <input className="ap-input" placeholder="e.g. 10% off on orders above ₹50,000" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="ap-card">
            <div className="ap-card-head">
              <div className="ap-card-icon" style={{ background: "#f0fdf4" }}><Leaf size={17} color="#16a34a" /></div>
              <p className="ap-card-title">Sustainability</p>
            </div>
            <div className="ap-card-body">
              <div className="ap-field">
                <span className="ap-label">Sustainability Tags <span style={{ color: "#9ca3af", fontWeight: 500 }}>(max 3)</span></span>
                <div className="ap-chips">
                  {tags.map(t => (
                    <button key={t.id} type="button" className={`ap-chip${selectedTags.includes(t.id) ? " on" : ""}`} onClick={() => toggle(selectedTags, t.id, setSelectedTags, 3)}>{t.name}</button>
                  ))}
                </div>
              </div>
              <div className="ap-field">
                <span className="ap-label">Key Sustainability Claim</span>
                <input className="ap-input" maxLength={100} placeholder="e.g. Made from 70% recycled PET bottles" value={sustainabilityClaim} onChange={e => setSustainabilityClaim(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div className="ap-card">
            <div className="ap-card-head">
              <div className="ap-card-icon" style={{ background: "#faf5ff" }}><Truck size={17} color="#9333ea" /></div>
              <p className="ap-card-title">Logistics &amp; Availability</p>
            </div>
            <div className="ap-card-body">
              <div className="ap-field">
                <span className="ap-label">Ships / Available To</span>
                <div className="ap-chips">
                  {SHIP_REGIONS.map(r => (
                    <button key={r} type="button" className={`ap-chip${shipRegions.includes(r) ? " on" : ""}`} onClick={() => toggle(shipRegions, r, setShipRegions)}>{r}</button>
                  ))}
                </div>
              </div>
              <label className="ap-checkbox-row">
                <input type="checkbox" className="ap-checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>In stock and ready to supply</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="ap-footer">
            <Link href="/vendor/products" className="ap-cancel"><X size={14} />Cancel</Link>
            <button type="submit" className="ap-submit" disabled={loading || productImages.busy}>
              {loading ? <div className="ap-spinner" /> : <Star size={14} />}
              {loading ? "Creating…" : "Create Listing"}
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
