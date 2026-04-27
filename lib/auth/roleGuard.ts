import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function getUserRole(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role : null;
}