"use client";

import Link from "next/link";
import {
  Bell,
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Package,
  Building2,
  Layers,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

/* ---------------- TYPES ---------------- */
type UserProfile = {
  name?: string;
  role?: "ADMIN" | "BUYER" | "VENDOR";
};

type Suggestion = {
  id: string;
  title: string;
  type: "product" | "vendor" | "category";
};

export default function Header() {
  const router = useRouter();

  /* UI */
  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [openAccount, setOpenAccount] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  /* AUTH */
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* SEARCH */
  const [queryText, setQueryText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  /* MASTER DATA */
  const [products, setProducts] = useState<Suggestion[]>([]);
  const [vendors, setVendors] = useState<Suggestion[]>([]);
  const [categories, setCategories] = useState<Suggestion[]>([]);
  const [openMobileCategories, setOpenMobileCategories] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);
  const mobileCatRef = useRef<HTMLDivElement>(null);

  /* ---------------- SCROLL HIDE ---------------- */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY && y > 100) setShow(false);
      else setShow(true);
      setLastScrollY(y);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAuthUser(null);
        setProfile(null);
        setLoadingUser(false);
        return;
      }

      setAuthUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) setProfile(snap.data() as UserProfile);
      setLoadingUser(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- LOAD SEARCH DATA (ONCE) ---------------- */
  useEffect(() => {
    async function loadSearchData() {
      /* PRODUCTS (PUBLIC APPROVED) */
      try {
        const pSnap = await getDocs(
          query(collection(db, "products"), where("approved", "==", true)),
        );
        setProducts(
          pSnap.docs.map((d) => ({
            id: d.id,
            title: d.data().title || "",
            type: "product",
          })),
        );
      } catch (e) {
        console.warn("Products fetch blocked:", e);
      }

      /* VENDORS (PUBLIC APPROVED ONLY) */
      try {
        const vSnap = await getDocs(
          query(collection(db, "vendors"), where("approved", "==", true)),
        );
        setVendors(
          vSnap.docs.map((d) => ({
            id: d.id,
            title: d.data().companyName || "",
            type: "vendor",
          })),
        );
      } catch (e) {
        console.warn("Vendors fetch blocked:", e);
      }

      /* CATEGORIES (ALWAYS PUBLIC) */
      try {
        const cSnap = await getDocs(collection(db, "categories"));
        setCategories(
          cSnap.docs.map((d) => ({
            id: d.id,
            title: d.data().name || "",
            type: "category",
          })),
        );
      } catch (e) {
        console.warn("Categories fetch blocked:", e);
      }
    }

    loadSearchData();
  }, []);

  /* ---------------- FILTER SUGGESTIONS ---------------- */
  useEffect(() => {
    if (!queryText.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const q = queryText.toLowerCase();

    const matches = [
      ...products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 3),
      ...vendors.filter((v) => v.title.toLowerCase().includes(q)).slice(0, 2),
      ...categories
        .filter((c) => c.title.toLowerCase().includes(q))
        .slice(0, 2),
    ];

    setSuggestions(matches);
    setShowDropdown(true);
  }, [queryText, products, vendors, categories]);

  /* ---------------- DASHBOARD LINK ---------------- */
  const dashboardLink =
    profile?.role === "ADMIN"
      ? "/admin"
      : profile?.role === "BUYER"
        ? "/buyer/dashboard"
        : profile?.role === "VENDOR"
          ? "/vendor/dashboard"
          : "/";

  /* ---------------- SEARCH ACTION ---------------- */
  function handleSearch() {
    if (!queryText.trim() && !selectedCategory) return;

    const params = new URLSearchParams();

    // default browse type
    params.set("type", "Product");

    if (queryText.trim()) {
      params.set("q", queryText.trim());
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }

    router.push(`/browse?${params.toString()}`);
    setShowDropdown(false);
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b transition-transform duration-300 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* ================= TOP BAR (DESKTOP) ================= */}
      <div className="hidden lg:block border-b text-sm">
        <div className="px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!loadingUser && authUser && (
              <>
                <span>Hi, {profile?.name || "User"}</span>
                <Link href={dashboardLink}>Dashboard</Link>
              </>
            )}
            <Link href="/deals">Daily Deals</Link>
            <Link href="/help">Help & Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            {/* <Link href="/vendor">Sell</Link> */}
            {!loadingUser && !authUser && (
              <div className="flex items-center gap-2">
                {/* BUY BUTTON */}
                <Link
                  href="/buyer"
                  className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
                >
                  Buyer
                </Link>

                {/* SELL BUTTON */}
                <Link
                  href="/login"
                  className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
                >
                  Seller
                </Link>
                <Link
                  href="/certification"
                  className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
                >
                  Get Certification
                </Link>
              </div>
            )}
          </div>

          {!loadingUser && authUser && (
            <>
              <Link
                href="/certification"
                className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
              >
                Get Certification
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ================= MAIN HEADER ================= */}
      <div className="px-4 py-4 flex items-center gap-4">
        {/* LOGO */}
        <Link href="/" className="shrink-0">
          <img src="/log.webp" className="md:h-12 h-10" />
        </Link>

        {/* SEARCH (DESKTOP) */}
        <div className="relative hidden lg:flex flex-1">
          <div className="flex w-full border-2 border-green-700 rounded-full overflow-hidden">
            <div className="px-3 flex items-center text-gray-400">
              <Search className="h-5 w-5" />
            </div>

            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Search products, vendors or categories"
              className="flex-1 px-2 py-2 outline-none"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-l px-3 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleSearch}
              className="bg-yellow-400 px-6 font-semibold"
            >
              Search
            </button>
          </div>

          {/* SUGGESTIONS */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 z-50">
              {suggestions.map((s) => (
                <button
                  key={`${s.type}-${s.id}`}
                  onMouseDown={() => {
                    setShowDropdown(false);

                    if (s.type === "product") {
                      router.push(`/products/${s.id}`);
                      return;
                    }

                    if (s.type === "vendor") {
                      router.push(`/vendor/${s.id}`);
                      return;
                    }

                    if (s.type === "category") {
                      router.push(`/browse?category=${s.id}`);
                      return;
                    }
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                >
                  {s.type === "product" && <Package className="h-4 w-4" />}
                  {s.type === "vendor" && <Building2 className="h-4 w-4" />}
                  {s.type === "category" && <Layers className="h-4 w-4" />}
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AUTH (DESKTOP) */}
        <div className="hidden lg:flex items-center gap-3 ml-auto">
          {!loadingUser && !authUser && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:underline"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-black text-white px-4 py-1.5 rounded-full"
              >
                Register
              </Link>
            </>
          )}

          {!loadingUser && authUser && (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setOpenAccount((p) => !p)}
                className="p-2 rounded-full bg-gray-100"
              >
                <User />
              </button>

              {openAccount && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg">
                  <button
                    onClick={() => router.push(dashboardLink)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      router.push("/");
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE ICONS */}
        {/* ================= MOBILE RIGHT SIDE ================= */}
        <div className="flex items-center gap-2 ml-auto lg:hidden">
          {/* SIGN IN / USER */}
          {!loadingUser && !authUser && (
            <div className="flex items-center gap-2">
              {/* SELL BUTTON */}
              <Link
                href="/login"
                className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
              >
                Seller
              </Link>

              <Link
                href="/certification"
                className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
              >
                Get Certification
              </Link>
            </div>
          )}

          {!loadingUser && authUser && (
            <button
              onClick={() => router.push(dashboardLink)}
              className="p-2 px-4 rounded-full bg-gray-100"
            >
              Dashboard
            </button>
          )}

          <Link
            href="/certification"
            className="
        px-4 py-1.5 rounded-full text-sm font-semibold text-white
        bg-[linear-gradient(135deg,var(--color-primary-green),var(--color-ocean-blue))]
        shadow-md hover:shadow-lg hover:brightness-95
        transition
      "
          >
            Get Certified
          </Link>
          {/* MENU BUTTON */}
          <button
            onClick={() => setOpenMobile((p) => !p)}
            className="p-2 rounded-full bg-gray-100"
          >
            {openMobile ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* ================= MOBILE SEARCH BAR ================= */}
      <div className="lg:hidden px-4 pb-3">
        <div className="flex gap-2">
          {/* SEARCH */}
          <div className="relative flex-1">
            <input
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search products"
              className="w-full h-10 pl-10 pr-3 rounded-full border border-gray-300 text-sm outline-none"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* CATEGORY BUTTON */}
          <div className="relative">
            <button
              onClick={() => setOpenMobileCategories((p) => !p)}
              className="h-10 px-4 rounded-full border border-gray-300 text-sm font-medium whitespace-nowrap bg-white"
            >
              {selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.title ||
                  "Category"
                : "Category"}
            </button>

            {openMobileCategories && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border z-50 max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setOpenMobileCategories(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  All Categories
                </button>

                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setOpenMobileCategories(false);
                      router.push(`/browse?category=${c.id}`);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {openMobile && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-6 py-5 space-y-4 text-sm flex flex-col">
            {!loadingUser && !authUser && (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpenMobile(false)}
                  className="flex-1 text-center py-2 rounded-full border"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpenMobile(false)}
                  className="flex-1 text-center py-2 rounded-full bg-black text-white"
                >
                  Register
                </Link>
              </div>
            )}

            {!loadingUser && authUser && (
              <>
                <p className="font-semibold">Hi, {profile?.name || "User"}</p>
                <button
                  className="text-left"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push(dashboardLink);
                  }}
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    setOpenMobile(false);
                    router.push("/");
                  }}
                  className="text-red-600 text-left"
                >
                  Logout
                </button>
              </>
            )}

            <hr />

            <Link href="/deals" onClick={() => setOpenMobile(false)}>
              Daily Deals
            </Link>
            <Link href="/help" onClick={() => setOpenMobile(false)}>
              Help & Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
