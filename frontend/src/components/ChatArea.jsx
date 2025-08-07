import { useState, useEffect } from "react";
import ChatBox from "./ChatBox";
import useChatMessages from "../hooks/useChatMessages";
import useSocket from "../hooks/useSocket";
import useSendMessage from "../hooks/useSendMessage";

export default function ChatArea({ toUsername, toId, currentUserId, onBack }) {
  const [text, setText] = useState("");
  const { messages } = useChatMessages(currentUserId, toId);
  const { socket } = useSocket();
  const { sendMessage } = useSendMessage(currentUserId);

  useEffect(() => {
    if (!toId) return;
    socket.emit("join_chat", toId.toString());
    socket.emit("read_messages", { fromId: toId, toId: currentUserId });
  }, [toId, socket, currentUserId]);

  const handleSend = () => {
    sendMessage({
      text,
      toId,
      onSuccess: () => setText(""),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
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
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-primary text-white px-5 py-2 rounded-full hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          send
        </button>
      </div>
    </div>
  );
}
