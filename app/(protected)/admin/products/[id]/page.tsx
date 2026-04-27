"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { uploadFileWithProgress } from "@/lib/storage";

/* ---------- CONSTANTS ---------- */
const LISTING_TYPES = ["Product", "Service"];
const AVAILABILITY = ["B2B", "B2C"];
const PRICE_TYPES = ["Fixed Price", "Starts From", "Price on Request"];
const SHIP_REGIONS = ["Local Only", "Countrywide", "Regional", "Worldwide"];

export default function AdminEditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  /* ---------- FORM STATE ---------- */
  const [selectedVendorId, setSelectedVendorId] = useState("");

  const [listingType, setListingType] = useState<string>("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [availableFor, setAvailableFor] = useState<string[]>([]);
  const [priceType, setPriceType] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [moq, setMoq] = useState("");
  const [discount, setDiscount] = useState("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sustainabilityClaim, setSustainabilityClaim] = useState("");

  const [shipRegions, setShipRegions] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);

  /* ---------- AUTH + LOAD ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");
      setUser(u);

      const snap = await getDoc(doc(db, "products", id as string));
      if (!snap.exists()) return router.push("/admin/products");

      const p = snap.data();

      setListingType(
        Array.isArray(p.listingType) ? p.listingType[0] : p.listingType || "",
      );

      setSelectedVendorId(p.vendorId || "");
      setTitle(p.title || "");
      setCategoryId(p.categoryId || "");
      setSubCategoryId(p.subCategoryId || "");
      setDescription(p.description || "");
      setExistingImages(p.images || []);
      setAvailableFor(p.availableFor || []);
      setPriceType(p.priceType || "");
      setPrice(p.price?.toString() || "");
      setCurrency(p.currency || "USD");
      setMoq(p.moq?.toString() || "");
      setDiscount(p.discount || "");
      
      // Support both old array formats and new ones
      setSelectedTags(p.sustainabilityTagIds || p.sustainabilityTags || []);
      
      setSustainabilityClaim(p.sustainabilityClaim || "");
      setShipRegions(p.shipRegions || []);
      setInStock(p.inStock ?? true);

      const [c, s, t, v] = await Promise.all([
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "subcategories")),
        getDocs(collection(db, "tags")),
        getDocs(collection(db, "vendors")),
      ]);

      setCategories(c.docs.map((d) => ({ id: d.id, ...d.data() })));
      setSubCategories(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTags(t.docs.map((d) => ({ id: d.id, ...d.data() })));
      setVendors(v.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoading(false);
    });

    return () => unsub();
  }, [id, router]);

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
    if (!selectedVendorId) {
      alert("Please select a vendor");
      return;
    }

    setSaving(true);

    try {
      const uploaded: string[] = [];
      for (const file of newImages) {
        const path = `products/${selectedVendorId}/${Date.now()}_${file.name}`;
        uploaded.push(await uploadFileWithProgress(file, path));
      }

      // map selected tag ids to names
      const selectedTagObjects = tags
        .filter((t) => selectedTags.includes(t.id))
        .map((t) => ({
          id: t.id,
          name: t.name,
        }));

      const selectedTagNames = selectedTagObjects.map((t) => t.name);

      const allImages = [...existingImages, ...uploaded];
      const orderedImages = [
        allImages[coverIndex],
        ...allImages.filter((_, i) => i !== coverIndex),
      ].filter(Boolean); // remove undefined if no images

      const vendor = vendors.find((v) => v.id === selectedVendorId);
      const vendorName = vendor?.companyName || "Unknown Vendor";

      await updateDoc(doc(db, "products", id as string), {
        vendorId: selectedVendorId,
        vendorName,

        listingType,
        title,
        description,
        categoryId,
        subCategoryId,
        images: orderedImages,
        availableFor,
        priceType,
        price: price ? Number(price) : null,
        currency,
        moq: moq ? Number(moq) : null,
        discount,
        sustainabilityTagIds: selectedTags,
        sustainabilityTagNames: selectedTagNames,
        sustainabilityClaim,
        shipRegions,
        inStock,
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Loading product…
      </div>
    );
  }

  const uploadLabel =
    newImages.length === 0
      ? "Click to upload new images"
      : newImages.map((f) => f.name).join(", ");

  const allImages = [...existingImages, ...newImages];

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-full mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Product / Service (Admin)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Update listing details for a vendor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <section className="bg-white rounded-2xl p-6 space-y-5">
            <h2 className="section">Vendor Assignment</h2>
            <div>
              <label className="label">Select Vendor *</label>
              <select
                className="input"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                required
              >
                <option value="">Select a vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName || v.name || v.id}
                  </option>
                ))}
              </select>
            </div>
          </section>

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
              <label className="label">Add More Images</label>

              <label className="upload-box">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (!e.target.files) return;

                    const selected = Array.from(e.target.files);

                    setNewImages((prev) => {
                      const combined = [...prev, ...selected].slice(0, 5 - existingImages.length);
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
                Upload up to 5 images total. Currently have {existingImages.length} saved images.
              </p>
            </div>
          </section>

          {allImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {allImages.map((fileOrUrl, index) => {
                const isExisting = index < existingImages.length;
                const url = isExisting ? (fileOrUrl as string) : URL.createObjectURL(fileOrUrl as File);

                return (
                  <div
                    key={index}
                    className={`relative rounded-xl overflow-hidden border-2
            ${coverIndex === index ? "border-black" : "border-gray-200"}
          `}
                  >
                    <img
                      src={url}
                      alt={`preview-${index}`}
                      className="h-24 w-full object-cover"
                    />

                    {coverIndex === index && (
                      <span className="absolute top-1 left-1 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                        Cover
                      </span>
                    )}

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
                          if (isExisting) {
                            setExistingImages((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          } else {
                            const newIdx = index - existingImages.length;
                            setNewImages((prev) =>
                              prev.filter((_, i) => i !== newIdx),
                            );
                          }
                          if (coverIndex === index) setCoverIndex(0);
                          else if (coverIndex > index) setCoverIndex(coverIndex - 1);
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
              disabled={saving}
              className={`relative inline-flex items-center justify-center gap-2
      px-10 py-2.5 rounded-full text-sm font-semibold text-white
      transition-all duration-200
      ${saving ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-[1px]"}
      bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
      shadow-[0_8px_20px_rgba(11,110,79,0.25)]
      hover:shadow-[0_12px_28px_rgba(10,76,138,0.35)]
    `}
            >
              {saving && (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              )}
              <span>{saving ? "Updating..." : "Update Listing"}</span>
            </button>
          </div>
        </form>
      </div>

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
