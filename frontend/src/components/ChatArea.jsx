import { useEffect, useState } from "react";
import socket from "../socket";
import ChatBox from "./ChatBox";
import { getMessagesWithUser } from "../services/api";

export default function ChatArea({ toUsername, toId, currentUserId, onBack }) {
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
    if (!toId || !currentUserId) return;
    console.log("JOINING", currentUserId, toId);
    socket.emit("join", currentUserId);
    socket.emit("join_chat", toId.toString());

    const handleReceive = (message) => {
      if (message.fromId === toId || message.toId === toId) {
        const newMessage = {
          ...message,
          createdAt: message.createdAt || new Date().toISOString(),
        };

        setMessages((prev) => {
          const updated = [...prev, newMessage];
          return updated;
        });
      }
    };
    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.emit("leave_chat", toId.toString());
    };
  }, [currentUserId, toId]);

  useEffect(() => {
    console.log("setting up delete_message listener");
    socket.on("delete_message", ({ messageId }) => {
      console.log("deleting message", messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    return () => socket.off("delete_message");
  }, []);

  const send = () => {
    if (!text.trim() || !toId) return;

    socket.emit("send_message", {
      from: currentUserId,
      to: toId,
      text,
    });
    setText("");
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="lg:hidden text-muted hover:text-primary"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-primary mx-auto lg:mx-0">
          {toUsername || "chat"}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 bg-gray-50">
        <ChatBox messages={messages} currentUserId={currentUserId} />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          type="text"
          placeholder="type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
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
