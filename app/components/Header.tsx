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
  const [scrolled, setScrolled] = useState(false);
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

      setScrolled(y > 20); // 👈 ADD THIS
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
      } catch (e) {}

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
      } catch (e) {}

      try {
        const cSnap = await getDocs(collection(db, "categories"));
        setCategories(
          cSnap.docs.map((d) => ({
            id: d.id,
            title: d.data().name || "",
            type: "category",
          })),
        );
      } catch (e) {}
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
    params.set("type", "Product");

    if (queryText.trim()) params.set("q", queryText.trim());
    if (selectedCategory) params.set("category", selectedCategory);

    router.push(`/browse?${params.toString()}`);
    setShowDropdown(false);
  }

  return (
    <>
      <div className="ann">
        🌿 <b>Brown Lens Verification is live.</b> India's first
        anti-greenwashing standard for B2B procurement.
        <Link href="#">See how it works →</Link>
      </div>

      <nav className={`nav ${scrolled ? "nav-scrolled" : ""} ${!show && "-translate-y-full"} transition-all duration-300`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo.png" alt="Sustainly Ecohub" width={150} />
          </Link>

          <div className="nav-search relative hidden lg:flex">
            <select
              className="hs-cat bg-transparent border-none outline-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search vendors, products, certifications…"
            />
            <button className="nav-search-btn" onClick={handleSearch}>
              <svg viewBox="0 0 18 18" fill="none">
                <circle
                  cx="7.5"
                  cy="7.5"
                  r="5.5"
                  stroke="white"
                  strokeWidth={1.8}
                />
                <path
                  d="M11.5 11.5L16 16"
                  stroke="white"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {showDropdown && suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 z-50">
                {suggestions.map((s) => (
                  <button
                    key={`${s.type}-${s.id}`}
                    onMouseDown={() => {
                      setShowDropdown(false);
                      if (s.type === "product")
                        router.push(`/products/${s.id}`);
                      if (s.type === "vendor") router.push(`/vendor/${s.id}`);
                      if (s.type === "category")
                        router.push(`/browse?category=${s.id}`);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-800"
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

          <div className="nav-links">
            <Link href="/browse?type=vendor" className="nav-link active">
              Find Vendors
            </Link>
            <Link href="/categories" className="nav-link">
              Categories
            </Link>
            <Link href="/brown-lens" className="nav-link">
              Brown Lens
            </Link>
            <Link href="/pricing" className="nav-link">
              Pricing
            </Link>
          </div>

          <div className="nav-actions">
            {!loadingUser && !authUser ? (
              <>
                <Link href="/login" className="nbtn nbtn-ghost">
                  Login
                </Link>
                <Link
                  href="/register?role=VENDOR"
                  className="nbtn nbtn-outline"
                >
                  List Business
                </Link>
                <Link href="/register?role=BUYER" className="nbtn nbtn-green">
                  Start Sourcing
                </Link>
              </>
            ) : (
              <>
                <span className="nbtn nbtn-ghost">
                  Hi, {profile?.name || "User"}
                </span>
                <button
                  onClick={() => router.push(dashboardLink)}
                  className="nbtn nbtn-outline"
                >
                  Dashboard
                </button>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    router.push("/");
                  }}
                  className="nbtn nbtn-ghost text-red-600 border-none"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto lg:hidden">
            <button
              onClick={() => setOpenMobile((p) => !p)}
              className="p-2 rounded-full bg-gray-100"
            >
              {openMobile ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {openMobile && (
          <div className="lg:hidden bg-white border-t">
            <div className="px-6 py-5 space-y-4 text-sm flex flex-col">
              {!loadingUser && !authUser && (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setOpenMobile(false)}
                    className="py-2.5 rounded-xl border text-center font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register?role=VENDOR"
                    onClick={() => setOpenMobile(false)}
                    className="py-2.5 rounded-xl border border-[var(--g)] text-[var(--g2)] text-center font-medium"
                  >
                    List Business
                  </Link>
                  <Link
                    href="/register?role=BUYER"
                    onClick={() => setOpenMobile(false)}
                    className="py-2.5 rounded-xl bg-[var(--g)] text-white text-center font-medium"
                  >
                    Start Sourcing
                  </Link>
                </div>
              )}

              {!loadingUser && authUser && (
                <>
                  <p className="font-semibold text-gray-800">
                    Hi, {profile?.name || "User"}
                  </p>
                  <button
                    className="text-left font-medium text-gray-700"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push(dashboardLink);
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      setOpenMobile(false);
                      router.push("/");
                    }}
                    className="text-red-600 font-medium text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
