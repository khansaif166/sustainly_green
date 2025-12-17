"use client";
import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
