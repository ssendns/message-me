import { useEffect, useState } from "react";
import socket from "../socket";

export default function ChatPage() {
  const [toId, setToId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const userId = Number(localStorage.getItem("id"));

  const fetchMessages = async () => {
    if (!toId) return;
    const res = await fetch(`http://localhost:3000/messages/${toId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setMessages(data.messages || []);
  };

  const send = () => {
    if (!text.trim()) return;

    socket.emit("send_message", {
      from: userId,
      to: Number(toId),
      text,
    });

    setMessages((prev) => [...prev, { fromId: userId, content: text }]);
    setText("");
  };

  useEffect(() => {
    socket.connect();

    socket.emit("join", userId);

    socket.on("receive_message", (msg) => {
      console.log("new message from socket:", msg);
      setMessages((prev) => [...prev, { fromId: msg.from, content: msg.text }]);
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
    };
  }, [userId]);

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins p-layout max-w-screen mx-auto">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-primary">
          chat as {username}
        </h1>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="enter user id to chat with"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className="flex-1 border border-muted rounded px-4 py-2 focus:outline-none"
          />
          <button
            onClick={fetchMessages}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            load chat
          </button>
        </div>

        <div className="bg-white rounded-card shadow-card p-4 h-64 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted">no messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm my-2 ${
                  msg.fromId === Number(localStorage.getItem("id"))
                    ? "text-right text-primary"
                    : "text-left"
                }`}
              >
                <span>{msg.content}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 border border-muted rounded px-4 py-2 focus:outline-none"
          />
          <button
            onClick={send}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
          >
            send
          </button>
        </div>
      </div>
    </main>
  );
}
