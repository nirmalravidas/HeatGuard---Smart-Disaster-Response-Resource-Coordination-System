"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function ReportSubmitPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [allocationPlan, setAllocationPlan] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  const getLocation = async () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      setLocationLoading(true);
      setLocationError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          setLocationLoading(false);
          resolve(loc);
        },
        (error) => {
          setLocationLoading(false);
          setLocationError("Could not get location. Using default.");
          resolve({ lat: 23.7957, lng: 86.4304 });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  // Auto-get location on page load
  useEffect(() => {
    getLocation();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!text.trim()) {
        alert("Please describe the situation before submitting.");
        return;
      }

      if (!location) {
        alert("Please wait for your location to be detected.");
        return;
      }

      setLoading(true);

      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const aiData = await res.json();
      setAiResult(aiData);

      const reportLocation = location;
      const reportRef = await addDoc(collection(db, "reports"), {
        userId: user.uid,
        text,
        urgencyScore: aiData.urgency_score,
        resources: aiData.needed_resources,
        explanation: aiData.explanation,
        status: "assigned",
        location: reportLocation,
        createdAt: serverTimestamp(),
      });

      const campsSnapshot = await getDocs(collection(db, "camps"));
      const camps = campsSnapshot.docs.map((campDoc) => ({
        id: campDoc.id,
        ...campDoc.data(),
      }));

      const allocationRes = await fetch("/api/ai/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reports: [
            {
              id: reportRef.id,
              text,
              urgencyScore: aiData.urgency_score,
              resources: aiData.needed_resources,
              location: reportLocation,
            },
          ],
          camps,
        }),
      });

      const allocation = await allocationRes.json();
      setAllocationPlan(allocation);

      if (allocation?.allocations?.[0]) {
        await updateDoc(doc(db, "reports", reportRef.id), {
          allocationPlan: allocation.allocations[0],
        });
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto text-white">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Report Heatwave</h1>

      {/* Location Section */}
      <div className="bg-gray-900 p-3 sm:p-4 rounded-lg mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold mb-1">📍 Your Location</h3>
            {location ? (
              <p className="text-sm text-green-400">
                Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
              </p>
            ) : locationLoading ? (
              <p className="text-sm text-yellow-400">Detecting location...</p>
            ) : locationError ? (
              <p className="text-sm text-red-400">{locationError}</p>
            ) : (
              <p className="text-sm text-gray-400">Click button to detect</p>
            )}
          </div>
          <button
            onClick={getLocation}
            disabled={locationLoading}
            className="bg-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-700 w-full sm:w-auto"
          >
            {locationLoading ? "..." : location ? "🔄 Refresh" : "📍 Get Location"}
          </button>
        </div>
      </div>

      <textarea
        className="w-full p-3 bg-gray-900 border rounded-lg text-base"
        rows={5}
        placeholder="Describe situation..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !location}
        className="bg-red-600 px-4 py-3 mt-4 rounded-lg w-full font-semibold disabled:opacity-50"
      >
        {loading ? "Analyzing and allocating..." : "Submit Report"}
      </button>

      {aiResult && (
        <div className="mt-6 bg-gray-900 p-4 rounded space-y-3">
          <h2 className="font-bold">AI Result</h2>
          <p>Urgency: {aiResult.urgency_score}</p>
          <p>Resources: {aiResult.needed_resources?.join(", ")}</p>
          <p>{aiResult.explanation}</p>
        </div>
      )}

      {allocationPlan?.allocations?.[0] && (
        <div className="mt-6 bg-gray-900 p-4 rounded space-y-3">
          <h2 className="font-bold">Allocation Recommendation</h2>
          <p>Camp: {allocationPlan.allocations[0].campName}</p>
          <p>Status: {allocationPlan.allocations[0].supplyStatus}</p>
          <p>Priority: {allocationPlan.allocations[0].priority}</p>
          <div className="text-sm text-gray-300">
            <div>Water: {allocationPlan.allocations[0].resources?.water}</div>
            <div>Medical kits: {allocationPlan.allocations[0].resources?.medicalKits}</div>
            <div>ORS: {allocationPlan.allocations[0].resources?.ORS}</div>
            <div>Cooling kits: {allocationPlan.allocations[0].resources?.coolingKits}</div>
          </div>
          <p className="text-gray-400">{allocationPlan.audit_notes}</p>
        </div>
      )}
    </div>
  );
}
