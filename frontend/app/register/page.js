"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username || !password) {
      setErrorMsg("Username and password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed.");
        return;
      }

      setSuccessMsg(
        `Account created for ${data.username}. Your link slug is: ${data.slug}`
      );

      // Optional: after a short delay, go to login page
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error("Error in register:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
      <div className="bg-white/95 rounded-3xl shadow-2xl border border-white/70 px-8 py-10 w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1 text-center">
          Create your WhisperBox
        </h1>
        <p className="text-xs text-slate-500 mb-6 text-center">
          Choose a username and password. We&apos;ll generate your link using
          your username.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Username
            </label>
            <input
  type="text"
  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
  placeholder="e.g. domm"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

            <p className="text-[11px] text-slate-400 mt-1">
              This will be used for your link (like /u/yourusername).
            </p>
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email (optional)
            </label>
            <input
  type="email"
  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password
            </label>
            <input
  type="password"
  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
  placeholder="At least 6 characters"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-center text-slate-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}
