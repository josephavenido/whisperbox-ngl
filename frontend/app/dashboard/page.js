"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function DashboardPage() {
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [userSlug, setUserSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username") || "";
    const storedSlug = localStorage.getItem("userSlug") || "";

    if (!token) {
      router.push("/login");
      return;
    }

    setUsername(storedUsername);
    setUserSlug(storedSlug);

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`${API_URL}/me/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Failed to load messages.");
          return;
        }

        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error fetching /me/messages:", err);
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("userSlug");
    }
    router.push("/login");
  };

  const shareLink =
    typeof window !== "undefined" && userSlug
      ? `${window.location.origin}/u/${userSlug}`
      : "";

  const handleCopyLink = async () => {
    if (!shareLink || typeof navigator === "undefined") return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (err) {
      console.error("Error copying link:", err);
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="bg-white/95 rounded-3xl shadow-2xl border border-white/70 w-full max-w-4xl p-6 md:p-8">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Your Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Hello <span className="font-semibold">{username || "..."}</span> – these are the
              anonymous messages people sent you.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {shareLink && (
              <div className="text-right max-w-xs">
                <p className="text-[11px] text-slate-500 mb-1">
                  Your public WhisperBox link:
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded-md max-w-[180px] overflow-x-auto">
                    {shareLink}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2 py-1 rounded-full border border-indigo-500 text-[11px] text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                {copyStatus && (
                  <p className="mt-1 text-[11px] text-emerald-600">{copyStatus}</p>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-inner p-4 md:p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading your messages...</p>
          ) : errorMsg ? (
            <p className="text-sm text-red-600">{errorMsg}</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              You don&apos;t have any messages yet. Share your link with friends and check back
              later!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-sm flex flex-col justify-between"
                >
                  <p className="text-slate-800 mb-3 whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString()
                        : ""}
                    </span>
                    <span>Anonymous</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
