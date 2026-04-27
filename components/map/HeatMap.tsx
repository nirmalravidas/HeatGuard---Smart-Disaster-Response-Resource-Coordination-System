"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot } from "firebase/firestore";
import L from "leaflet";

export default function HeatMap() {
  const [reports, setReports] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  // FIX LEAFLET ICONS (CLIENT ONLY)
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    setReady(true);
  }, []);

  // LIVE FIRESTORE
  useEffect(() => {
    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCamps = onSnapshot(collection(db, "camps"), (snap) => {
      setCamps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubReports();
      unsubCamps();
    };
  }, []);

  if (!ready) {
    return (
      <div className="text-white p-4">
        Loading map...
      </div>
    );
  }

  return (
    <MapContainer
      center={[23.7957, 86.4304]}
      zoom={12}
      style={{ height: "80vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* REPORTS */}
      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.location?.lat || 23.79, r.location?.lng || 86.43]}
        >
          <Popup>
            <div>
              <h3>Report</h3>
              <p>{r.text}</p>
              <p>{r.urgencyScore}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* 🏕️ CAMPS */}
      {camps.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]}>
          <Popup>
            <div>
              <h3>Camp</h3>
              <p>Capacity: {c.capacity}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}