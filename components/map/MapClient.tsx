"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/client";
import { collection, onSnapshot } from "firebase/firestore";
import L from "leaflet";

import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "leaflet.heat";

/* ---------------- DISTANCE ---------------- */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ---------------- CAMP ALLOCATION ---------------- */
function assignNearestCamp(report: any, camps: any[]) {
  let best = null;
  let min = Infinity;

  camps.forEach((camp) => {
    const dist = getDistance(
      report.location.lat,
      report.location.lng,
      camp.lat,
      camp.lng
    );

    if (dist < min) {
      min = dist;
      best = camp;
    }
  });

  return best;
}

/* ---------------- ROUTE ---------------- */
function RouteLine({ from, to }: any) {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    const Lany: any = (window as any).L;

    const routing = Lany.Routing.control({
      waypoints: [
        Lany.latLng(from.lat, from.lng),
        Lany.latLng(to.lat, to.lng),
      ],
      lineOptions: {
        styles: [{ color: "blue", weight: 4 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
    });

    routing.addTo(map);

    return () => {
      try {
        map.removeControl(routing);
      } catch {}
    };
  }, [map, from?.lat, from?.lng, to?.lat, to?.lng]);

  return null;
}

/* ---------------- HEATMAP ---------------- */
function HeatLayer({ data }: { data: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !data.length) return;

    const Lany: any = (window as any).L;
    if (!Lany?.heatLayer) return;

    const layer = Lany.heatLayer(data, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: {
        0.2: "blue",
        0.4: "cyan",
        0.6: "yellow",
        0.8: "orange",
        1.0: "red",
      },
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, data]);

  return null;
}

/* ---------------- MAIN MAP ---------------- */
export default function MapClient() {
  const [reports, setReports] = useState<any[]>([]);
  const [camps, setCamps] = useState<any[]>([]);
  const [heatData, setHeatData] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  /* FIX ICONS */
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

  /* FIRESTORE LIVE DATA */
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "reports"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReports(data);

      setHeatData(
        data.map((r: any) => [
          r.location?.lat || 23.79,
          r.location?.lng || 86.43,
          r.urgencyScore ? r.urgencyScore / 100 : 0.5,
        ])
      );
    });

    const unsub2 = onSnapshot(collection(db, "camps"), (snap) => {
      setCamps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  if (!ready) return <p className="text-white">Loading map...</p>;

  return (
    <MapContainer
      center={[23.7957, 86.4304]}
      zoom={12}
      style={{ height: "80vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* HEATMAP */}
      <HeatLayer data={heatData} />

      {/* REPORTS */}
      {reports.map((r) => (
        <Marker
          key={r.id}
          position={[r.location?.lat || 23.79, r.location?.lng || 86.43]}
        >
          <Popup>
            <b>Report</b>
            <p>{r.text}</p>
            <p>{r.urgencyScore}</p>
          </Popup>
        </Marker>
      ))}

      {/* CAMPS */}
      {camps.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]}>
          <Popup>
            <b>Camp</b>
            <p>Capacity: {c.capacity}</p>
          </Popup>
        </Marker>
      ))}

      {/* SOS */}
      {reports
        .filter((r) => r.urgencyScore > 80)
        .map((r) => (
          <Marker
            key={"sos-" + r.id}
            position={[r.location?.lat || 23.79, r.location?.lng || 86.43]}
          >
            <Popup>
              <div className="text-red-600 font-bold animate-pulse">
                 SOS EMERGENCY
              </div>
              <p>{r.text}</p>
              <p>Critical: {r.urgencyScore}</p>
            </Popup>
          </Marker>
        ))}

      {/* ROUTES */}
      {reports.map((r) => {
        const camp = assignNearestCamp(r, camps);
        if (!camp) return null;

        return (
          <RouteLine
            key={"route-" + r.id}
            from={r.location}
            to={camp}
          />
        );
      })}
    </MapContainer>
  );
}