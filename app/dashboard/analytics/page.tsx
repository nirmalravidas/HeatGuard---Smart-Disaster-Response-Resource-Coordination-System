"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";

export default function AnalyticsPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "reports"));
      setReports(snap.docs.map(d => d.data()));
    };

    load();
  }, []);

  const avgUrgency =
    reports.reduce((acc, r) => acc + (r.urgencyScore || 0), 0) /
    (reports.length || 1);

  return (
    <div className="p-4 sm:p-6 text-white space-y-4">

      <h1 className="text-xl sm:text-2xl font-bold">System Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">

        <div className="bg-gray-900 p-3 sm:p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Reports</p>
          <h2 className="text-xl sm:text-2xl font-bold">{reports.length}</h2>
        </div>

        <div className="bg-gray-900 p-3 sm:p-4 rounded-lg">
          <p className="text-sm text-gray-400">Avg Urgency</p>
          <h2 className="text-xl sm:text-2xl font-bold">
            {avgUrgency.toFixed(1)}
          </h2>
        </div>

        <div className="bg-gray-900 p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-1">
          <p className="text-sm text-gray-400">Critical Cases</p>
          <h2 className="text-xl sm:text-2xl font-bold">
            {reports.filter(r => r.urgencyScore > 80).length}
          </h2>
        </div>

      </div>
    </div>
  );
}