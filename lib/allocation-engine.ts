import { db } from "@/lib/firebase/client";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

type Camp = {
  id: string;
  currentLoad: number;
  capacity: number;
};

export async function allocateReportToCamp(reportId: string) {
    void reportId;
  const campsSnap = await getDocs(collection(db, "camps"));

  let bestCamp: Camp | null = null;
  let bestScore = Infinity;

  for (const c of campsSnap.docs) {
    const data = c.data() as Omit<Camp, "id">;

    const currentLoad = data.currentLoad ?? 0;
    const capacity = data.capacity ?? 1;

    const loadRatio = currentLoad / capacity;

    if (loadRatio < bestScore) {
      bestScore = loadRatio;

      bestCamp = {
        id: c.id,
        currentLoad,
        capacity,
      };
    }
  }

  if (!bestCamp) {
    throw new Error("No camps available");
  }

  const campRef = doc(db, "camps", bestCamp.id);

  await updateDoc(campRef, {
    currentLoad: bestCamp.currentLoad + 1,
  });

  return bestCamp;
}