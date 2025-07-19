import { useState, useRef, useEffect } from "react";
import { Trash2, Copy } from "lucide-react";
import useSocket from "../hooks/useSocket";

export default function Message({ message, currentUserId }) {
  const isOwn = message.fromId === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldOpenUpwards, setShouldOpenUpwards] = useState(false);
  const messageRef = useRef(null);

  const { socket, isReady } = useSocket();

  const time =
    message.createdAt &&
    new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleDelete = () => {
    if (!isReady) return;
    socket.emit("delete_message", {
      id: message.id,
      userId: currentUserId,
    });
  };

  const handleClickOutside = (e) => {
    if (!messageRef.current?.contains(e.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuOpen && messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      const distanceFromBottom = window.innerHeight - rect.bottom;
      setShouldOpenUpwards(distanceFromBottom < 200);
    }
  }, [menuOpen]);

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} my-2`}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      <div
        ref={messageRef}
        className={`relative px-4 py-2 max-w-xs break-words rounded-xl ${
          isOwn
            ? "bg-primary text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <div className="pr-7">{message.content}</div>

        {time && (
          <span
            className={`absolute bottom-1 right-2 text-[10px] ${
              isOwn ? "text-white/70" : "text-gray-500"
            }`}
          >
            {time}
          </span>
        )}

        {menuOpen && (
          <ul
            className={`absolute z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-xl text-sm overflow-hidden animate-fade-in
              ${shouldOpenUpwards ? "bottom-full mb-1" : "top-full mt-1"} 
              ${isOwn ? "right-0" : "left-0"}`}
          >
            {isOwn && (
              <li
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-black hover:bg-red-100 cursor-pointer"
              >
                <Trash2 size={16} />
                delete
              </li>
            )}
            <li
              className="flex items-center gap-2 px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(message.content);
                setMenuOpen(false);
              }}
            >
              <Copy size={16} />
              copy
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
