import { useState, useRef } from "react";
import useSocket from "../hooks/useSocket";
import MessageMenu from "./MessageMenu";
import EditInput from "./EditInput";
import MessageContent from "./MessageContent";
import useMessageMenu from "../hooks/useMessageMenu";
import useUploadImage from "../hooks/useUploadImage";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";

export default function Message({ message, currentUserId }) {
  const isOwn = message.fromId === currentUserId;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || "");
  const [editImageUrl, setEditImageUrl] = useState(message.imageUrl || null);
  const { socket, isReady } = useSocket();

  const fileInputRef = useRef(null);
  const { uploadImage, loading: uploading } = useUploadImage();

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
    setEditText(message.content || "");
    setEditImageUrl(message.imageUrl || null);
    closeMenu();
  };

  const pickImage = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setEditImageUrl(url);
  };

  const removeImage = () => setEditImageUrl(null);

  const handleEditSubmit = () => {
    socket.emit("edit_message", {
      id: message.id,
      userId: currentUserId,
      newText: editText,
      newImageUrl: editImageUrl,
    });
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
          <div className="space-y-2">
            {editImageUrl && (
              <div className="relative">
                <img
                  src={editImageUrl}
                  alt="attachment"
                  className="max-w-[260px] rounded-lg block"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-white/90 text-black rounded-full p-1"
                  title="remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <button
                onClick={pickImage}
                disabled={uploading}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  isOwn ? "bg-white/10" : "bg-white"
                } disabled:opacity-50`}
                title="change image"
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ImageIcon size={16} />
                )}
                {editImageUrl ? "replace image" : "add image"}
              </button>
            </div>

            <EditInput
              value={editText}
              onChange={setEditText}
              onSave={handleEditSubmit}
              onCancel={() => setIsEditing(false)}
              saveDisabled={uploading}
            />
          </div>
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
