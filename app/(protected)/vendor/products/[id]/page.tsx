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

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  /* ---------- FORM STATE ---------- */
  const [listingType, setListingType] = useState<string[]>([]);
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
      if (!snap.exists()) return router.push("/vendor/products");

      const p = snap.data();
      if (p.vendorId !== u.uid) return router.push("/vendor/products");

      setListingType(p.listingType || []);
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
      setSelectedTags(p.sustainabilityTags || []);
      setSustainabilityClaim(p.sustainabilityClaim || "");
      setShipRegions(p.shipRegions || []);
      setInStock(p.inStock ?? true);

      const c = await getDocs(collection(db, "categories"));
      const s = await getDocs(collection(db, "subcategories"));
      const t = await getDocs(collection(db, "tags"));

      setCategories(c.docs.map((d) => ({ id: d.id, ...d.data() })));
      setSubCategories(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTags(t.docs.map((d) => ({ id: d.id, ...d.data() })));

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
        : [...prev, value]
    );
  }

  const filteredSubCats = subCategories.filter(
    (s) => s.categoryId === categoryId
  );

  /* ---------- SAVE ---------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const uploaded: string[] = [];
      for (const file of newImages) {
        const path = `products/${user.uid}/${Date.now()}_${file.name}`;
        uploaded.push(await uploadFileWithProgress(file, path));
      }

      const allImages = [...existingImages, ...uploaded];
      const orderedImages = [
        allImages[coverIndex],
        ...allImages.filter((_, i) => i !== coverIndex),
      ];

      await updateDoc(doc(db, "products", id as string), {
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
        sustainabilityTags: selectedTags,
        sustainabilityClaim,
        shipRegions,
        inStock,
        approved: false,
        updatedAt: serverTimestamp(),
      });

      router.push("/vendor/products");
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

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-full mx-auto space-y-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Product / Service
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* BASIC */}
          <section className="bg-white rounded-2xl p-6 space-y-4">
            <h2 className="section">Basic Info</h2>

            {/* <div>
              <label className="label">Listing Type</label>
              <div className="flex gap-2">
                {LISTING_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggle(listingType, t, setListingType)}
                    className={`chip ${listingType.includes(t) && "active"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div> */}

            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
            />

            <textarea
              rows={4}
              className="input resize-none h-[200px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </section>

          {/* IMAGES */}
          <section className="bg-white rounded-2xl p-6 space-y-4">
            <h2 className="section">Images</h2>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setNewImages((prev) =>
                  [...prev, ...Array.from(e.target.files || [])].slice(0, 5)
                )
              }
            />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[...existingImages].map((img, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl overflow-hidden border-2 ${
                    coverIndex === i ? "border-black" : "border-gray-200"
                  }`}
                >
                  <img
                    src={img}
                    className="h-28 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverIndex(i)}
                    className="absolute bottom-0 w-full bg-black/80 text-white text-xs py-1"
                  >
                    Set Cover
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* SUBMIT */}
          <div className="flex justify-end">
            <button
              disabled={saving}
              className="rounded-full bg-black text-white px-6 py-2 text-sm"
            >
              {saving ? "Updating..." : "Update Listing"}
            </button>
          </div>
        </form>
      </div>

      {/* GLOBAL STYLES */}
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
        }
        .label {
          font-size: 0.875rem;
          font-weight: 500;
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
      `}</style>
    </main>
  );
}
