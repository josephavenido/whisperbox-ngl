"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function PublicUserPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug; // e.g. "domm"

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  // Load user + messages when slug is available
  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await fetch(`${API_URL}/user/${slug}/messages`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "Could not load user.");
          return;
        }

        setUser(data.user);
        setMessages(data.messages || []);
      } catch (err) {
        console.error("Error fetching public messages:", err);
        setErrorMsg("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSendMsg("");
    setErrorMsg("");

    if (!text.trim()) {
      setErrorMsg("Please write a message before sending.");
      return;
    }

    try {
      setSending(true);

      const res = await fetch(`${API_URL}/user/${slug}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send message.");
        return;
      }

      // Add new message to top of list
      setMessages((prev) => [
        {
          id: data.id,
          text,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setText("");
      setSendMsg("Message sent anonymously ✅");
    } catch (err) {
      console.error("Error sending message:", err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // If still loading initial data
  if (loading && !user && !errorMsg) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
        <p className="text-white text-sm">Loading...</p>
      </main>
    );
  }

  // If invalid slug / user not found
  if (!loading && errorMsg && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 px-4">
        <div className="bg-white/95 rounded-3xl shadow-2xl border border-white/70 px-8 py-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            Oops!
          </h1>
          <p className="text-sm text-slate-500 mb-4">{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Go back home
          </button>
        </div>
      </main>
    );
  }

  const displayName = user?.username || slug;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
        {/* Left side: send message */}
        <div className="flex-1 bg-white/95 rounded-3xl shadow-2xl border border-white/70 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
            Send {displayName} an anonymous message
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mb-4">
            Your name will not be stored. Just share what you really think,
            honestly and respectfully.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              className="w-full h-28 md:h-32 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder={`Write something for ${displayName}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Message will be sent anonymously.</span>
              <span>
                {text.length} / 500
              </span>
            </div>

            {errorMsg && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {errorMsg}
              </div>
            )}

            {sendMsg && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                {sendMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {sending ? "Sending..." : `Send to ${displayName}`}
            </button>
          </form>
        </div>

        {/* Right side: recent messages (optional) */}
        <div className="flex-1 bg-white/90 rounded-3xl shadow-2xl border border-white/70 p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
            Recent anonymous whispers
          </h2>
          {messages.length === 0 ? (
            <p className="text-xs md:text-sm text-slate-500">
              No messages yet. Be the first to send {displayName} something!
            </p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-sm"
                >
                  <p className="text-slate-800 mb-2 whitespace-pre-wrap">
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
