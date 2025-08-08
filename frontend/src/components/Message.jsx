import { useState } from "react";
import useSocket from "../hooks/useSocket";
import MessageMenu from "./MessageMenu";
import EditInput from "./EditInput";
import MessageContent from "./MessageContent";
import useMessageMenu from "../hooks/useMessageMenu";

export default function Message({ message, currentUserId }) {
  const isOwn = message.fromId === currentUserId;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { socket, isReady } = useSocket();

  const { messageRef, menuOpen, shouldOpenUpwards, openMenu, closeMenu } =
    useMessageMenu();

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
      toId: message.toId,
      fromId: message.fromId,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    closeMenu();
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

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} my-2`}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu();
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
          <EditInput
            value={editContent}
            onChange={setEditContent}
            onSave={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <MessageContent
            content={message.content}
            imageUrl={message.imageUrl}
            time={time}
            edited={message.edited}
          />
        )}

        {menuOpen && (
          <MessageMenu
            isOwn={isOwn}
            shouldOpenUpwards={shouldOpenUpwards}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCopy={() => {
              navigator.clipboard.writeText(message.content);
              closeMenu();
            }}
          />
        )}
      </div>
    </div>
  );
}
