"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function Sidebar({ role }: { role: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (path: string) =>
    `block w-full text-left rounded-2xl px-3 py-3 transition ${
      pathname === path
        ? "bg-slate-800 text-white"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-950/95 backdrop-blur-sm px py-2.5 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {open ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 h-full w-64 sm:w-72 bg-slate-950 border-r border-slate-800 p-4 sm:p-6 transition-transform duration-300 flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static`}
      >
        {/* Mobile Close */}
        <div className="md:hidden flex justify-end mb-3">
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">
            HeatGuard
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            {role?.toUpperCase() || "USER"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Fast access to your dashboard tools.
          </p>
        </div>

        {/* Navigation */}
        <div className="space-y-2 text-sm">
          {role === "reporter" && (
            <>
              <button
                className={linkClass("/dashboard/reporter")}
                onClick={() => navigate("/dashboard/reporter")}
              >
                My Reports
              </button>
              <button
                className={linkClass("/dashboard/reporter/submit")}
                onClick={() =>
                  navigate("/dashboard/reporter/submit")
                }
              >
                Submit Report
              </button>
              <button
                className={linkClass("/dashboard/reporter/analytics")}
                onClick={() =>
                  navigate("/dashboard/reporter/analytics")
                }
              >
                Analytics
              </button>
            </>
          )}

          {role === "allocator" && (
            <>
              <button
                className={linkClass("/dashboard/allocator")}
                onClick={() => navigate("/dashboard/allocator")}
              >
                AI Allocation
              </button>
              <button
                className={linkClass("/dashboard/map")}
                onClick={() => navigate("/dashboard/map")}
              >
                Live Map
              </button>
              <button
                className={linkClass("/dashboard/analytics")}
                onClick={() => navigate("/dashboard/analytics")}
              >
                System Analytics
              </button>
            </>
          )}

          {role === "helper" && (
            <>
              <button
                className={linkClass("/dashboard/helpers")}
                onClick={() => navigate("/dashboard/helpers")}
              >
                Helpers
              </button>
              <button
                className={linkClass("/dashboard/analytics")}
                onClick={() => navigate("/dashboard/analytics")}
              >
                Analytics
              </button>
              <button
                className={linkClass("/dashboard/map")}
                onClick={() => navigate("/dashboard/map")}
              >
                Live Map
              </button>
            </>
          )}
        </div>

        {/* Logout */}
        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-400 transition"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}