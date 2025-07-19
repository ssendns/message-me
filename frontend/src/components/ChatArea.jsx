import { useEffect, useState } from "react";
import socket from "../socket";
import ChatBox from "./ChatBox";
import { getMessagesWithUser } from "../services/api";

export default function ChatArea({ toUsername, toId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!toId || !token) return;

    const loadMessages = async () => {
      try {
        const res = await getMessagesWithUser(toId, token);
        setMessages(res.messages || []);
      } catch (err) {
        console.error("failed to fetch messages:", err);
      }
    };

    loadMessages();
  }, [toId, token]);

  useEffect(() => {
    socket.connect();
    socket.emit("join", currentUserId);

    const handleReceive = (msg) => {
      if (msg.from === toId || msg.to === toId) {
        setMessages((prev) => [
          ...prev,
          { fromId: msg.from, content: msg.text },
        ]);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.disconnect();
    };
  }, [currentUserId, toId]);

  const send = () => {
    if (!text.trim() || !toId) return;

    socket.emit("send_message", {
      from: currentUserId,
      to: toId,
      text,
    });

    setMessages((prev) => [...prev, { fromId: currentUserId, content: text }]);
    setText("");
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-lg font-semibold text-primary">
          {toUsername || "chat"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        <ChatBox messages={messages} currentUserId={currentUserId} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          type="text"
          placeholder="type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={send}
          className="bg-primary text-white px-5 py-2 rounded-full hover:bg-opacity-90 transition-all"
        >
          send
        </button>
      </div>
    </div>
  );
}
