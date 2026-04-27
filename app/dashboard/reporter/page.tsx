"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ReporterDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      const q = query(
        collection(db, "reports"),
        where("userId", "==", u.uid)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setReports(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- DELETE ---------------- */
  const deleteReport = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reports", id));
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Delete failed");
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">
          Reporter Dashboard
        </h1>

        <button
          onClick={() => router.push("/dashboard/reporter/submit")}
          className="bg-red-600 px-4 py-2 rounded-md text-sm"
        >
          New Report
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-gray-300 text-sm">Total Reports</h2>
          <p className="text-xl font-bold">{reports.length}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-gray-300 text-sm">Active Cases</h2>
          <p className="text-xl font-bold">
            {reports.filter((r) => r.status === "pending").length}
          </p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-gray-300 text-sm">Resolved</h2>
          <p className="text-xl font-bold">
            {reports.filter((r) => r.status === "resolved").length}
          </p>
        </div>
      </div>

      {/* REPORT LIST */}
      <div className="mt-6 bg-gray-900 p-4 rounded-lg">

        <h2 className="text-lg font-semibold mb-4">
          My Reports
        </h2>

        {reports.length === 0 ? (
          <p className="text-gray-400">
            No reports submitted yet.
          </p>
        ) : (
          <div className="space-y-3">

            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >

                {/* LEFT */}
                <div>
                  <p className="font-semibold">
                    {r.title || "Heatwave Report"}
                  </p>
                  <p className="text-sm text-gray-400">
                    Status: {r.status || "pending"}
                  </p>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">

                  <span className="text-sm text-gray-300">
                    {r.urgencyScore
                      ? `${r.urgencyScore}/100`
                      : "Processing"}
                  </span>

                  {/* DELETE */}
                  <button
                    onClick={() => deleteReport(r.id)}
                    className="text-red-400 text-sm hover:underline"
                  >
                    Delete
                  </button>

                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

        <button
          onClick={() => router.push("/dashboard/reporter/submit")}
          className="bg-red-700 p-4 rounded-lg"
        >
          Submit Emergency
        </button>

        <button
          onClick={() => router.push("/dashboard/reporter/analytics")}
          className="bg-blue-700 p-4 rounded-lg"
        >
          View Analytics
        </button>

      </div>

    </div>
  );
}