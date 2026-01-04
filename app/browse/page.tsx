"use client";

import { Suspense } from "react";
import BrowseClient from "./BrowseClient";

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading marketplace…</div>}>
      <BrowseClient />
    </Suspense>
  );
}
