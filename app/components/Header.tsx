"use client";

import Link from "next/link";
import {
  Bell,
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

/* ---------------- TYPES ---------------- */
type UserProfile = {
  name?: string;
  email?: string;
  phone?: string;
  role?: "ADMIN" | "BUYER" | "VENDOR";
};

export default function Header() {
  const router = useRouter();

  const [show, setShow] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [openAccount, setOpenAccount] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);

  /* ---------------- SCROLL HIDE / SHOW ---------------- */
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
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
      setLoadingUser(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- CLOSE DROPDOWN ---------------- */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setOpenAccount(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---------------- DASHBOARD LINK ---------------- */
  const dashboardLink =
    profile?.role === "ADMIN"
      ? "/admin"
      : profile?.role === "BUYER"
      ? "/buyer/dashboard"
      : profile?.role === "VENDOR"
      ? "/vendor/dashboard"
      : "/";

  /* ================= UI ================= */
  return (
    <header
      className={`
        sticky top-0 z-50
        bg-(--color-bg-white)
        border-b border-(--color-border)
        transition-transform duration-300
        ${show ? "translate-y-0" : "-translate-y-full"}
      `}
    >
      {/* ================= TOP BAR (DESKTOP ONLY) ================= */}
      <div className="hidden lg:block border-b border-(--color-border) text-sm">
        <div className="max-w-full mx-auto px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-4 text-(--color-text-secondary)">
            {!loadingUser && !authUser && (
              <>
                <Link
                  href="/login"
                  className="text-(--color-ocean-blue) hover:underline"
                >
                  Sign in
                </Link>
                <span>or</span>
                <Link
                  href="/register"
                  className="text-(--color-ocean-blue) hover:underline"
                >
                  Register
                </Link>
              </>
            )}

            {!loadingUser && authUser && (
              <>
                <span className="font-medium text-[var(--color-text-primary)">
                  Hi, {profile?.name || "User"}
                </span>
                <span>|</span>
                <Link
                  href={dashboardLink}
                  className="text-(--color-ocean-blue) hover:underline"
                >
                  Dashboard
                </Link>
              </>
            )}

            <span>|</span>
            <Link href="/deals" className="hover:underline">Daily Deals</Link>
            <Link href="/outlet" className="hover:underline">Brand Outlet</Link>
            <Link href="/gift-cards" className="hover:underline">Gift Cards</Link>
            <Link href="/help" className="hover:underline">Help & Contact</Link>
          </div>

          <div className="flex items-center gap-4 text-(--color-text-secondary)">
            <Link href="/vendor" className="hover:underline">Sell</Link>
            <Bell className="h-4 w-4 cursor-pointer" />
            <ShoppingCart className="h-4 w-4 cursor-pointer" />
          </div>
        </div>
      </div>

      {/* ================= MAIN HEADER ================= */}
      <div className="max-w-full mx-auto px-4 py-4 flex items-center gap-4">

        {/* LOGO */}
        <Link href="/" className="shrink-0">
          <img src="/logo.png" alt="Logo" className="h-10" />
        </Link>

        {/* SEARCH (DESKTOP) */}
        <div className="hidden lg:flex flex-1 items-center border-2 border-(--color-primary-green) rounded-full overflow-hidden">
          <div className="px-3 text-(--color-text-muted)">
            <Search className="h-5 w-5" />
          </div>
          <input
            placeholder="Search for products or services"
            className="flex-1 px-2 py-2 outline-none"
          />
          <select className="border-l px-3 py-2 text-sm outline-none">
            <option>All Categories</option>
          </select>
          <button className="bg-(--color-solar-yellow) px-6 py-2 font-medium">
            Search
          </button>
        </div>

        {/* ACCOUNT ICON */}
        <div className="relative ml-auto" ref={accountRef}>
          <button
            onClick={() => setOpenAccount((p) => !p)}
            className="p-2 rounded-full bg-(--color-bg-soft)"
          >
            <User />
          </button>

          {openAccount && authUser && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold">{profile?.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {authUser.email}
                </p>
              </div>

              <button
                onClick={() => router.push(dashboardLink)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                Go to Dashboard
              </button>

              <button
                onClick={async () => {
                  await signOut(auth);
                  router.push("/");
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* MOBILE MENU */}
        <button
          onClick={() => setOpenMobile((p) => !p)}
          className="lg:hidden p-2 rounded-full hover(--color-bg-soft)"
        >
          {openMobile ? <X /> : <Menu />}
        </button>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {openMobile && (
        <div className="lg:hidden bg-white border-t animate-slideDown">
          <div className="px-6 py-4 space-y-4 text-sm flex flex-col">
            <Link href="/deals">Daily Deals</Link>
            <Link href="/outlet">Brand Outlet</Link>
            <Link href="/gift-cards">Gift Cards</Link>
            <Link href="/help">Help & Contact</Link>
            <Link href="/vendor">Sell</Link>
          </div>
        </div>
      )}
    </header>
  );
}
