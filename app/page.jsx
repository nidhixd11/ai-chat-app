"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) {
      setReply("Please enter a message.");
      return;
    }

    setLoading(true);
    setReply("");
    setSource("");

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      setReply(data.reply || "No reply received from backend.");
      setSource(data.source || "");
    } catch (error) {
      setReply("Error connecting to backend. Please make sure backend is running.");
    }

    setLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        background: "#f4f6f8",
        color: "#111827"
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#ffffff",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          color: "#111827"
        }}
      >
        <h1 style={{ textAlign: "center", color: "#111827" }}>AI Chat App</h1>

        <p style={{ textAlign: "center", color: "#374151", fontSize: "18px" }}>
          Full-stack AI chat app using Next.js frontend and Node/Express backend.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          rows={5}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
            fontSize: "16px",
            boxSizing: "border-box",
            color: "#111827",
            background: "#ffffff",
            border: "1px solid #9ca3af",
            borderRadius: "8px"
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            color: "#ffffff",
            background: loading ? "#6b7280" : "#111827",
            border: "none",
            borderRadius: "8px"
          }}
        >
          {loading ? "Generating..." : "Send Message"}
        </button>

        {reply && (
          <div
            style={{
              marginTop: "25px",
              padding: "15px",
              background: "#e5e7eb",
              borderRadius: "8px",
              color: "#111827"
            }}
          >
            <h3 style={{ color: "#111827" }}>AI Response</h3>
            <p style={{ color: "#111827", lineHeight: "1.5" }}>{reply}</p>
            {source && (
              <p style={{ color: "#111827" }}>
                <strong>Source:</strong> {source}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}