"use client";
import { ReactNode, useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/supabaseAuth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
