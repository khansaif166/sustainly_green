"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/supabaseAuth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* ---------- CONSTANTS ---------- */
const LISTING_TYPES = ["Product", "Service"];
const AVAILABILITY = ["B2B", "B2C"];
const PRICE_TYPES = ["Fixed Price", "Starts From", "Price on Request"];
const SHIP_REGIONS = ["Local Only", "Countrywide", "Regional", "Worldwide"];

export default function AddProductPage() {
  const router = useRouter();

  const [vendorApproved, setVendorApproved] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  /* ---------- FORM STATE ---------- */
  const [listingType, setListingType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [availableFor, setAvailableFor] = useState<string[]>([]);
  const [priceType, setPriceType] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [moq, setMoq] = useState("");
  const [discount, setDiscount] = useState("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sustainabilityClaim, setSustainabilityClaim] = useState("");

  const [shipRegions, setShipRegions] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------- AUTH CHECK ---------- */
  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }
      setVendorApproved(true);
  }, [router]);

  /* ---------- LOAD MASTER DATA ---------- */
  useEffect(() => {
    async function load() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      };

      const [categoriesResponse, subcategoriesResponse, tagsResponse] =
        await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name&active=eq.true&order=name.asc`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/subcategories?select=id,name,category_id&active=eq.true&order=name.asc`, { headers }),
          fetch(`${SUPABASE_URL}/rest/v1/sustainability_tags?select=id,name&active=eq.true&order=name.asc`, { headers }),
        ]);

      const [categoryRows, subcategoryRows, tagRows] = await Promise.all([
        categoriesResponse.json(),
        subcategoriesResponse.json(),
        tagsResponse.json(),
      ]);

      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setSubCategories(
        Array.isArray(subcategoryRows)
          ? subcategoryRows.map((row) => ({
              id: row.id,
              name: row.name,
              categoryId: row.category_id,
            }))
          : [],
      );
      setTags(Array.isArray(tagRows) ? tagRows : []);
    }
    load();
  }, []);

  /* ---------- HELPERS ---------- */
  function toggle(list: string[], value: string, setter: any, max?: number) {
    setter((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : max && prev.length >= max
          ? prev
          : [...prev, value],
    );
  }

  const filteredSubCats = subCategories.filter(
    (s) => s.categoryId === categoryId,
  );

  /* ---------- SUBMIT ---------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const session = getStoredSession();

    if (!vendorApproved || !session) {
      router.push("/login");
      return;
    }

    // if (images.length === 0 || images.length > 5) {
    //   alert("Please upload 1–5 images.");
    //   return;
    // }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        title,
        description,
        listingType,
        availableFor,
        categoryId,
        subCategoryId,
          images: [],
        priceType,
          price,
        currency,
          moq,
        discount,
        shipRegions,
        inStock,
        sustainabilityTagIds: selectedTags,
        sustainabilityClaim,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || "Failed to create listing");
      }

      router.push("/vendor/dashboard");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }
  const uploadLabel =
    images.length === 0
      ? "Click to upload images"
      : images.map((f) => f.name).join(", ");

  /* ---------- UI ---------- */
  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-full mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Add Product / Service Listing
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Your listing will be reviewed before it goes live.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* BASIC INFO */}
          <section className="bg-white rounded-2xl p-6 space-y-5">
            <h2 className="section">Basic Listing Info</h2>

            {/* Listing Type */}
            <div>
              <label className="label">Listing Type *</label>
              <div className="flex gap-2">
                {LISTING_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setListingType(t)}
                    className={`chip ${listingType === t ? "active" : ""}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label">Listing Title *</label>
              <input
                className="input"
                placeholder="Eg: Recycled PET Fabric for Apparel"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <p className="help">Max 120 characters</p>
            </div>

            {/* Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select
                  className="input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Subcategory *</label>
                <select
                  className="input"
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  disabled={!categoryId}
                  required
                >
                  <option value="">Select subcategory</option>
                  {filteredSubCats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Short Description *</label>
              <textarea
                rows={4}
                maxLength={500}
                className="input resize-none"
                placeholder="Explain what your product or service is, how it helps buyers, and what makes it sustainable…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Images */}
            <div>
              <label className="label">Images</label>

              <label className="upload-box">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return;

                    const selected = Array.from(e.target.files);

                    setImages((prev) => {
                      const combined = [...prev, ...selected].slice(0, 5);
                      return combined;
                    });

                    e.target.value = "";
                  }}
                />

                <span className="truncate max-w-full text-center">
                  {uploadLabel}
                </span>
              </label>

              <p className="help">
                Upload up to 5 images. Supabase Storage upload is being migrated, so selected files are preview-only for now.
              </p>
            </div>
          </section>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {images.map((file, index) => {
                const url = URL.createObjectURL(file);

                return (
                  <div
                    key={index}
                    className={`relative rounded-xl overflow-hidden border-2
            ${coverIndex === index ? "border-black" : "border-gray-200"}
          `}
                  >
                    {/* IMAGE */}
                    <img
                      src={url}
                      alt={`preview-${index}`}
                      className="h-24 w-full object-cover"
                    />

                    {/* COVER BADGE */}
                    {coverIndex === index && (
                      <span className="absolute top-1 left-1 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}

                    {/* ACTIONS */}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-1 py-1">
                      <button
                        type="button"
                        onClick={() => setCoverIndex(index)}
                        className="text-[10px] text-white"
                      >
                        Set Cover
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          if (coverIndex === index) setCoverIndex(0);
                        }}
                        className="text-[10px] text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* COMMERCIAL */}
          <section className="bg-white rounded-2xl p-6 space-y-5">
            <h2 className="section">Commercial Info</h2>

            <div>
              <label className="label">Available For *</label>
              <div className="flex gap-2">
                {AVAILABILITY.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggle(availableFor, a, setAvailableFor)}
                    className={`chip ${availableFor.includes(a) && "active"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Price Type *</label>
              <select
                className="input"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <option value="">Select price type</option>
                {PRICE_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            {(priceType === "Fixed Price" || priceType === "Starts From") && (
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  className="input"
                  placeholder="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="MOQ (optional)"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                />
              </div>
            )}

            <input
              className="input"
              placeholder="Discount / Offer (optional)"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </section>

          {/* SUSTAINABILITY */}
          <section className="bg-white rounded-2xl p-6 space-y-5">
            <h2 className="section">Sustainability</h2>

            <div>
              <label className="label">Sustainability Tags (max 3)</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      toggle(selectedTags, t.id, setSelectedTags, 3)
                    }
                    className={`chip ${
                      selectedTags.includes(t.id) && "active"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <input
              className="input"
              maxLength={100}
              placeholder="Key sustainability claim (eg: Made from 70% recycled PET)"
              value={sustainabilityClaim}
              onChange={(e) => setSustainabilityClaim(e.target.value)}
            />
          </section>

          {/* LOGISTICS */}
          <section className="bg-white rounded-2xl p-6 space-y-5">
            <h2 className="section">Logistics & Availability</h2>

            <div>
              <label className="label">Ships / Available To</label>
              <div className="flex flex-wrap gap-2">
                {SHIP_REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggle(shipRegions, r, setShipRegions)}
                    className={`chip ${shipRegions.includes(r) && "active"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              In stock and ready to supply
            </label>
          </section>

          {/* SUBMIT */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`relative inline-flex items-center justify-center gap-2
      px-10 py-2.5 rounded-full text-sm font-semibold text-white
      transition-all duration-200
      ${loading ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-[1px]"}
      bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
      shadow-[0_8px_20px_rgba(11,110,79,0.25)]
      hover:shadow-[0_12px_28px_rgba(10,76,138,0.35)]
    `}
            >
              {loading && (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}

              <span>{loading ? "Saving..." : "Create Listing"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* GLOBAL UI HELPERS */}
      <style jsx global>{`
        .input {
          width: 100%;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: black;
          background: white;
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        }
        .label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        .help {
          font-size: 0.75rem;
          color: #6b7280;
        }
        .section {
          font-size: 0.875rem;
          font-weight: 600;
        }
        .chip {
          border: 1px solid #e5e7eb;
          border-radius: 9999px;
          padding: 0.35rem 0.9rem;
          font-size: 0.75rem;
          background: white;
        }
        .chip.active {
          background: black;
          color: white;
          border-color: black;
        }
        .upload-box {
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px dashed #d1d5db;
          border-radius: 0.75rem;
          padding: 1.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          cursor: pointer;
        }
        .upload-box:hover {
          background: #f9fafb;
        }
      `}</style>
    </main>
  );
}
