"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from "recharts";

export default function Analytics() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "reports"));
      const reports = snap.docs.map(d => d.data());
      setData(reports);
    };

    load();
  }, []);

  const total = data.length;
  const pending = data.filter(r => r.status === "pending").length;
  const resolved = data.filter(r => r.status === "resolved").length;

  const chartData = [
    { name: "Pending", value: pending },
    { name: "Resolved", value: resolved },
  ];

  return (
    <div className="p-4 space-y-6">

      <h1 className="text-xl font-bold"> Analytics</h1>

      {/* BAR */}
      <BarChart width={300} height={200} data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" />
      </BarChart>

      {/* PIE */}
      <PieChart width={300} height={300}>
        <Pie data={chartData} dataKey="value" outerRadius={100}>
          <Cell fill="orange" />
          <Cell fill="green" />
        </Pie>
      </PieChart>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded">Total: {total}</div>
        <div className="bg-yellow-600 p-4 rounded">Pending: {pending}</div>
        <div className="bg-green-600 p-4 rounded">Resolved: {resolved}</div>
      </div>

    </div>
  );
}