"use client";

import Link from "next/link";
import { Bell, ShoppingCart } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full border-b bg-white text-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-10 items-center justify-between">
          
          {/* Left section */}
          <div className="flex items-center gap-2 text-gray-700">
            <span>Hi!</span>
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
            <span>or</span>
            <Link href="/register" className="text-blue-600 hover:underline">
              register
            </Link>

            <span className="mx-2 text-gray-300">|</span>

            <Link href="/deals" className="hover:underline">
              Daily Deals
            </Link>
            <Link href="/outlet" className="hover:underline">
              Brand Outlet
            </Link>
            <Link href="/gift-cards" className="hover:underline">
              Gift Cards
            </Link>
            <Link href="/help" className="hover:underline">
              Help & Contact
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-5 text-gray-700">
            <Link href="/sell" className="hover:underline">
              Sell
            </Link>

            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              Watchlist
              <span className="text-xs">▼</span>
            </div>

            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              My eBay
              <span className="text-xs">▼</span>
            </div>

            <Bell className="h-4 w-4 cursor-pointer" />
            <ShoppingCart className="h-4 w-4 cursor-pointer" />
          </div>

        </div>
      </div>
    </header>
  );
}
