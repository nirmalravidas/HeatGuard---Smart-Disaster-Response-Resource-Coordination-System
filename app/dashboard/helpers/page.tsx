"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

type Helper = {
  id: string;
  name: string;
  skills: string[];
  available: boolean;
};

export default function HelpersPage() {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");

  const fetchHelpers = async () => {
    const snap = await getDocs(collection(db, "helpers"));

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Helper, "id">),
    }));

    setHelpers(data);
  };

 useEffect(() => {
  const load = async () => {
    await fetchHelpers();
  };

  load();
}, []);

  const addHelper = async () => {
    if (!name) return;

    await addDoc(collection(db, "helpers"), {
      name,
      skills: skills.split(",").map((s) => s.trim()),
      available: true,
      createdAt: serverTimestamp(),
    });

    setName("");
    setSkills("");
    fetchHelpers();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        👷 Helpers / Volunteers
      </h1>

      {/* ADD HELPER */}
      <div className="border p-4 rounded mb-6">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Helper Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-2"
          placeholder="Skills (medical, rescue, logistics)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />

        <button
          onClick={addHelper}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Helper
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {helpers.map((h) => (
          <div
            key={h.id}
            className="border p-4 rounded"
          >
            <h2 className="font-bold">{h.name}</h2>

            <p className="text-sm">
              Skills: {h.skills?.join(", ")}
            </p>

            <p className="text-sm">
              Status:{" "}
              <b>
                {h.available ? "Available" : "Busy"}
              </b>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}