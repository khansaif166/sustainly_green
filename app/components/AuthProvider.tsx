"use client";
import { ReactNode, useEffect, useState } from "react";
import { getValidSession } from "@/lib/supabaseAuth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getValidSession().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
