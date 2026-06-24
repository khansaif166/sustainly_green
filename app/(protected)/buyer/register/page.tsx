"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuyerRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/register?role=BUYER");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
      Redirecting to buyer registration...
    </main>
  );
}
