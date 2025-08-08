import { useState, useEffect, useRef } from "react";
import ChatBox from "./ChatBox";
import useChatMessages from "../hooks/useChatMessages";
import useSocket from "../hooks/useSocket";
import useSendMessage from "../hooks/useSendMessage";
import useUploadImage from "../hooks/useUploadImage";
import { Paperclip } from "lucide-react";

export default function ChatArea({ toUsername, toId, currentUserId, onBack }) {
  const [messageText, setMessageText] = useState("");
  const [pending, setPending] = useState([]);
  const fileInputRef = useRef(null);

  const { messages } = useChatMessages(currentUserId, toId);
  const { socket } = useSocket();
  const { sendMessage } = useSendMessage(currentUserId);
  const { uploadImage, loading, error } = useUploadImage();

  useEffect(() => {
    if (!toId) return;
    socket.emit("join_chat", toId.toString());
    socket.emit("read_messages", { fromId: toId, toId: currentUserId });
  }, [toId, socket, currentUserId]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    sendMessage({
      text: messageText,
      toId,
      onSuccess: () => setMessageText(""),
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const tempId = `temp-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);

    const tempMessage = {
      id: tempId,
      fromId: currentUserId,
      toId,
      content: previewUrl,
      createdAt: new Date().toISOString(),
      loading: true,
      type: "image",
    };

    setPending((p) => [...p, tempMessage]);

    const url = await uploadImage(file);

    setPending((p) => p.filter((m) => m.id !== tempId));
    URL.revokeObjectURL(previewUrl);

    if (!url) return;

    sendMessage({
      text: url,
      toId,
      onSuccess: () => {},
    });
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
        <ChatBox
          messages={[...messages, ...pending]}
          currentUserId={currentUserId}
        />
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={handlePickFile}
          disabled={loading}
          title="attach image"
          className="p-2 rounded-full border hover:bg-gray-100 disabled:opacity-50"
        >
          <Paperclip size={18} />
        </button>

        <input
          type="text"
          placeholder={loading ? "uploading image…" : "type your message..."}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSend}
          disabled={!messageText.trim()}
          className="bg-primary text-white px-5 py-2 rounded-full hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          send
        </button>
      </div>
      {error && <div className="px-6 pb-3 text-xs text-red-600">{error}</div>}
    </div>
  );
}
