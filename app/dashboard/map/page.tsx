"use client";

import dynamic from "next/dynamic";

// CRITICAL: disable SSR completely
const MapClient = dynamic(() => import("@/components/map/MapClient"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <div className="p-2 sm:p-4 bg-gray-950 text-white min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
        Live Crisis Map
      </h1>

      <div className="h-[60vh] sm:h-[80vh]">
        <MapClient />
      </div>
    </div>
  );
}