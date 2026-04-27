"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [role, setRole] = useState<"reporter" | "allocator">("reporter");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // TEMP ROLE LOGIC (replace with Firestore later)
      if (user.email?.includes("allocator")) {
        setRole("allocator");
      } else {
        setRole("reporter");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B1220] text-white">

      {/* SIDEBAR */}
      <Sidebar role={role} />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4">
        {children}
      </div>

    </div>
  );
}