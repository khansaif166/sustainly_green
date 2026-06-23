"use client";
import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsub = onAuthStateChanged(auth, () => {
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
