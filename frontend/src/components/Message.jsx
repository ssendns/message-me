import { useState, useRef, useEffect } from "react";
import useSocket from "../hooks/useSocket";
import MessageMenu from "./MessageMenu";

export default function Message({ message, currentUserId }) {
  const isOwn = message.fromId === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldOpenUpwards, setShouldOpenUpwards] = useState(false);
  const messageRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

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

  const handleEdit = () => {
    setIsEditing(true);
    setMenuOpen(false);
  };

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      socket.emit("edit_message", {
        id: message.id,
        userId: currentUserId,
        newContent: editContent,
      });
    }
    setIsEditing(false);
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
        {isEditing ? (
          <div className="flex gap-2">
            <input
              className="text-sm px-2 py-1 rounded w-full text-black"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditSubmit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
            />
            <button
              onClick={handleEditSubmit}
              className="text-xs px-2 py-1 bg-primary text-white rounded"
            >
              save
            </button>
          </div>
        ) : (
          <div className="flex">
            <div className={`${message.edited ? "pr-14" : "pr-5"}`}>
              {message.content}
            </div>
            {time && (
              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-70">
                {message.edited && <span>edited</span>}
                <span>{time}</span>
              </div>
            )}
          </div>
        )}

        {menuOpen && (
          <MessageMenu
            isOwn={isOwn}
            shouldOpenUpwards={shouldOpenUpwards}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCopy={() => {
              navigator.clipboard.writeText(message.content);
              setMenuOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
