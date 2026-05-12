export async function sendChat(message) {
  const res = await fetch("http://localhost:3003/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }

  return res.json();
}
