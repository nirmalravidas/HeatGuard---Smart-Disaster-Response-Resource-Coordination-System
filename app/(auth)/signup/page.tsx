"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export default function Signup() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("reporter");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        role,
        createdAt: serverTimestamp(),
      });

      console.log("Signup success");

    if (role === "reporter") {
      router.push("/dashboard/reporter");
    } else if (role === "allocator") {
      router.push("/dashboard/allocator");
    } else if (role === "helper") {
      router.push("/dashboard/helpers");
    } else {
      router.push("/dashboard");
    }

    } catch (err: any) {
      console.log("Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-950/95 p-6 sm:p-8 shadow-2xl shadow-black/25">
      <div className="mb-5 sm:mb-6 space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-400/80">Create account</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Get started with HeatGuard</h1>
        <p className="text-sm text-slate-400">
          Choose your role and join the disaster response workflow.
        </p>
      </div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        autoComplete="email"
        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        placeholder="Email address"
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        autoComplete="new-password"
        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        placeholder="Password"
      />

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
      >
        <option value="reporter">Reporter</option>
        <option value="allocator">Allocator</option>
        <option value="helper">Helper</option>
      </select>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <button
        onClick={handleSignup}
        disabled={loading || !email || !password}
        className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <div className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="font-semibold text-cyan-300 hover:text-cyan-200"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}