"use client";

import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
      <div className="bg-white/95 rounded-3xl shadow-2xl border border-white/70 px-8 py-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          WhisperBox
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Create your own link and let people send you anonymous messages.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition-colors"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="w-full py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold rounded-full hover:bg-slate-100 transition-colors"
          >
            I already have an account
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-slate-400">
          by: sepphy avenids igop Backend: <span className="font-mono">{API_URL}</span>
        </p>
      </div>
    </main>
  );
}
