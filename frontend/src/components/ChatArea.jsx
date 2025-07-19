import { useState, useEffect } from "react";
import ChatBox from "./ChatBox";
import useChatMessages from "../hooks/useChatMessages";
import useChatList from "../hooks/useChatList";
import useSocket from "../hooks/useSocket";

export default function ChatArea({ toUsername, toId, currentUserId, onBack }) {
  const [text, setText] = useState("");
  const { messages } = useChatMessages(currentUserId, toId);
  const { socket } = useSocket();

  useEffect(() => {
    if (toId) {
      socket.emit("join_chat", toId.toString());
    }
  }, [toId, socket]);

  const send = () => {
    if (!text.trim() || !toId) return;

    socket.emit("send_message", {
      from: currentUserId,
      to: toId,
      text,
    });
    setText("");
    useChatList.refreshChats;
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
