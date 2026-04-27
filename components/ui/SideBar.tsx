"use client";

import { useRouter } from "next/navigation";

export default function Sidebar({ role }: { role: "reporter" | "allocator" }) {
  const router = useRouter();

  return (
    <div className="h-screen w-64 bg-[#0B1220] border-r border-[#1F2A44] text-white flex flex-col">

      {/* HEADER */}
      <div className="p-5 border-b border-[#1F2A44]">
        <h1 className="text-lg font-bold">HeatGuard AI</h1>
        <p className="text-xs text-gray-400">{role.toUpperCase()}</p>
      </div>

      {/* NAV */}
      <div className="flex-1 p-3 space-y-2 text-sm">

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full text-left p-2 rounded hover:bg-[#111A2E]"
        >
          Dashboard
        </button>

        {role === "reporter" && (
          <button
            onClick={() => router.push("/dashboard/reporter")}
            className="w-full text-left p-2 rounded hover:bg-[#111A2E]"
          >
            Report Issue
          </button>
        )}

        {role === "allocator" && (
          <>
            <button
              onClick={() => router.push("/dashboard/allocator")}
              className="w-full text-left p-2 rounded hover:bg-[#111A2E]"
            >
              AI Allocation
            </button>

            <button
              onClick={() => router.push("/dashboard/map")}
              className="w-full text-left p-2 rounded hover:bg-[#111A2E]"
            >
              Live Map
            </button>
          </>
        )}

        <button className="w-full text-left p-2 rounded hover:bg-[#111A2E]">
          Settings
        </button>

      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-[#1F2A44] text-xs text-gray-500">
        Emergency System v1.0
      </div>

    </div>
  );
}