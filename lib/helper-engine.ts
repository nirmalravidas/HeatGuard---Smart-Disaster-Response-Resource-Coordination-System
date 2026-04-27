import { db } from "@/lib/firebase/client";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

type Helper = {
  id: string;
  available: boolean;
  assignedCampId?: string;
};

export async function assignHelpersToCamp(campId: string) {
  const snap = await getDocs(collection(db, "helpers"));

  const availableHelpers: Helper[] = snap.docs
    .map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Helper, "id">),
    }))
    .filter((h) => h.available === true);

  const selected = availableHelpers.slice(0, 2);

  for (const helper of selected) {
    await updateDoc(doc(db, "helpers", helper.id), {
      available: false,
      assignedCampId: campId,
    });
  }

  return selected;
}