"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";

type Camp = {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  supplies: {
    water: number;
    medicalKits: number;
    ORS: number;
    coolingKits: number;
  };
};

export default function CampsPage() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [campInputs, setCampInputs] = useState<Record<string, any>>({});
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(0);
  const [water, setWater] = useState(0);
  const [medicalKits, setMedicalKits] = useState(0);
  const [ors, setOrs] = useState(0);
  const [coolingKits, setCoolingKits] = useState(0);

  const fetchCamps = async () => {
    const snapshot = await getDocs(collection(db, "camps"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Camp, "id">) }));
    setCamps(data);
    setCampInputs(
      data.reduce((acc, camp) => {
        acc[camp.id] = {
          water: camp.supplies?.water ?? 0,
          medicalKits: camp.supplies?.medicalKits ?? 0,
          ORS: camp.supplies?.ORS ?? 0,
          coolingKits: camp.supplies?.coolingKits ?? 0,
        };
        return acc;
      }, {} as Record<string, any>)
    );
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  const addCamp = async () => {
    if (!name) return;

    await addDoc(collection(db, "camps"), {
      name,
      capacity,
      currentLoad: 0,
      supplies: {
        water,
        medicalKits,
        ORS: ors,
        coolingKits,
      },
      location: {
        lat: 0,
        lng: 0,
      },
      createdAt: serverTimestamp(),
    });

    setName("");
    setCapacity(0);
    setWater(0);
    setMedicalKits(0);
    setOrs(0);
    setCoolingKits(0);
    await fetchCamps();
  };

  const updateCampSupplies = async (campId: string) => {
    const supplies = campInputs[campId];
    if (!supplies) return;

    await updateDoc(doc(db, "camps", campId), {
      supplies,
    });
    await fetchCamps();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">🏕️ Relief Camps</h1>

      <div className="border p-4 rounded mb-6 bg-[#111A2E] shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="border border-[#1F2A44] bg-[#0B1220] p-3 rounded text-white"
            placeholder="Camp Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            className="border border-[#1F2A44] bg-[#0B1220] p-3 rounded text-white"
            placeholder="Capacity"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <input
            type="number"
            className="border border-[#1F2A44] bg-[#0B1220] p-3 rounded text-white"
            placeholder="Water"
            value={water}
            onChange={(e) => setWater(Number(e.target.value))}
          />
          <input
            type="number"
            className="border border-[#1F2A44] bg-[#0B1220] p-3 rounded text-white"
            placeholder="Medical Kits"
            value={medicalKits}
            onChange={(e) => setMedicalKits(Number(e.target.value))}
          />
          <input
            type="number"
            className="border border-[#1F2A44] bg-[#0B1220] p-3 rounded text-white"
            placeholder="ORS"
            value={ors}
            onChange={(e) => setOrs(Number(e.target.value))}
          />
          <input
            type="number"
            className="border border-[#1F2A44] bg-[#0B1220] p-3 rounded text-white"
            placeholder="Cooling Kits"
            value={coolingKits}
            onChange={(e) => setCoolingKits(Number(e.target.value))}
          />
        </div>

        <button onClick={addCamp} className="mt-4 bg-green-600 px-4 py-2 rounded">
          Add Camp
        </button>
      </div>

      <div className="space-y-4">
        {camps.map((camp) => (
          <div key={camp.id} className="border border-[#1F2A44] rounded-xl p-4 bg-[#111A2E]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{camp.name}</h2>
                <p className="text-gray-400">Load: {camp.currentLoad}/{camp.capacity}</p>
              </div>
              <button onClick={() => updateCampSupplies(camp.id)} className="bg-blue-600 px-3 py-2 rounded">
                Save inventory
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <label className="block">
                <span className="text-gray-400 text-sm">Water</span>
                <input
                  type="number"
                  value={campInputs[camp.id]?.water ?? 0}
                  onChange={(e) =>
                    setCampInputs((prev) => ({
                      ...prev,
                      [camp.id]: { ...prev[camp.id], water: Number(e.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded border border-[#1F2A44] bg-[#0B1220] p-2 text-white"
                />
              </label>
              <label className="block">
                <span className="text-gray-400 text-sm">Medical Kits</span>
                <input
                  type="number"
                  value={campInputs[camp.id]?.medicalKits ?? 0}
                  onChange={(e) =>
                    setCampInputs((prev) => ({
                      ...prev,
                      [camp.id]: { ...prev[camp.id], medicalKits: Number(e.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded border border-[#1F2A44] bg-[#0B1220] p-2 text-white"
                />
              </label>
              <label className="block">
                <span className="text-gray-400 text-sm">ORS</span>
                <input
                  type="number"
                  value={campInputs[camp.id]?.ORS ?? 0}
                  onChange={(e) =>
                    setCampInputs((prev) => ({
                      ...prev,
                      [camp.id]: { ...prev[camp.id], ORS: Number(e.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded border border-[#1F2A44] bg-[#0B1220] p-2 text-white"
                />
              </label>
              <label className="block">
                <span className="text-gray-400 text-sm">Cooling Kits</span>
                <input
                  type="number"
                  value={campInputs[camp.id]?.coolingKits ?? 0}
                  onChange={(e) =>
                    setCampInputs((prev) => ({
                      ...prev,
                      [camp.id]: { ...prev[camp.id], coolingKits: Number(e.target.value) },
                    }))
                  }
                  className="mt-1 w-full rounded border border-[#1F2A44] bg-[#0B1220] p-2 text-white"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
