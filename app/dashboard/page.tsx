"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { role } = useRole();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (role === "allocator") {
      router.push("/dashboard/allocator");
    } else if (role === "helper") {
      router.push("/dashboard/helpers");
    } else {
      router.push("/dashboard/reporter");
    }
  }, [user, role, loading]);

  return <p>Redirecting...</p>;
}