"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      // Firebase login
      const userCred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCred.user;

      // Fetch user role from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User profile not found in Firestore");
      }

      const userData = userSnap.data();

      console.log("Login success:", userData);

      // ROLE BASED REDIRECT
      if (userData.role === "reporter") {
        router.push("/dashboard/reporter");
      } else if (userData.role === "allocator") {
        router.push("/dashboard/allocator");
      } else if (userData.role === "helper") {
        router.push("/dashboard/helpers");
      } else {
        router.push("/dashboard");
      }

    } catch (err: any) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-700 bg-slate-950/95 p-6 sm:p-8 shadow-2xl shadow-black/25">
      <div className="mb-5 sm:mb-6 space-y-2 sm:space-y-3">
        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-cyan-400/80">HeatGuard</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">Welcome back</h1>
        <p className="text-sm text-slate-400">
          Sign in to access your dashboard, submit reports, and manage allocations.
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
        autoComplete="current-password"
        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
        placeholder="Password"
      />

      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading || !email || !password}
        className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <div className="mt-6 text-center text-sm text-slate-400">
        New to HeatGuard?{' '}
        <button
          type="button"
          onClick={() => router.push("/signup")}
          className="font-semibold text-cyan-300 hover:text-cyan-200"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}