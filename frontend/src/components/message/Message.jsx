import { useState, useRef, useMemo, useCallback } from "react";
import MessageMenu from "./MessageMenu";
import EditInput from "./EditInput";
import MessageContent from "./MessageContent";
import useMenu from "../../hooks/useMenu";
import useUploadImage from "../../hooks/useUploadImage";
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import useMessage from "../../hooks/useMessage";

export default function Message({ message, currentUserId, authorName = null }) {
  const isOwn = message.fromId === currentUserId;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || "");
  const [editImageUrl, setEditImageUrl] = useState(message.imageUrl || null);
  const [editImagePublicId, setEditImagePublicId] = useState(
    message.imagePublicId || null
  );
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const { uploadImage, loading: uploading } = useUploadImage();
  const { rowRef, open, openUpwards, openMenu, closeMenu } = useMenu();

  const { editMessage, deleteMessage } = useMessage();

  const time = useMemo(() => {
    return (
      message.createdAt &&
      new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, [message.createdAt]);

  const handleDelete = useCallback(async () => {
    try {
      setSaving(true);
      await deleteMessage({ messageId: message.id, chatId: message.chatId });
    } finally {
      setSaving(false);
    }
  }, [deleteMessage, message.id, message.chatId]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditText(message.text || "");
    setEditImageUrl(message.imageUrl || null);
    closeMenu();
  }, [message.text, message.imageUrl, closeMenu]);

  const pickImage = useCallback(() => fileInputRef.current?.click(), []);

  const onFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      const uploaded = await uploadImage(file);
      if (uploaded?.url) {
        setEditImageUrl(uploaded.url);
        setEditImagePublicId(uploaded.publicId || null);
      }
    },
    [uploadImage]
  );

  const removeImage = useCallback(() => {
    setEditImageUrl(null);
    setEditImagePublicId(null);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    try {
      setSaving(true);
      await editMessage({
        messageId: message.id,
        chatId: message.chatId,
        text: editText,
        imageUrl: editImageUrl,
        imagePublicId: editImagePublicId,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }, [
    editMessage,
    message.id,
    message.chatId,
    editText,
    editImageUrl,
    editImagePublicId,
  ]);

  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openMenu();
    },
    [openMenu]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.text || "");
    } catch {
      //
    } finally {
      closeMenu();
    }
  }, [message.text, closeMenu]);

  const menuDisabled = saving || uploading;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} my-2`}>
      <div
        ref={rowRef}
        onContextMenu={handleContextMenu}
        className={`relative px-4 py-2 max-w-xs break-words rounded-xl ${
          isOwn
            ? "bg-primary text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        {authorName && !isOwn && (
          <div
            className={`text-[11px] leading-none font-medium truncate ${
              isOwn ? "text-white/80" : "text-gray-600"
            }`}
          >
            {authorName}
          </div>
        )}

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
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-white/90 text-black rounded-full p-1"
                  title="remove image"
                  aria-label="remove image"
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
                type="button"
                onClick={pickImage}
                disabled={uploading}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                  isOwn ? "bg-white/10" : "bg-white"
                } disabled:opacity-50`}
                title={editImageUrl ? "replace image" : "add image"}
                aria-label={editImageUrl ? "replace image" : "add image"}
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
              saveDisabled={uploading || saving}
            />
          </div>
        ) : (
          <MessageContent
            text={message.text}
            imageUrl={message.imageUrl}
            time={time}
            edited={message.edited}
            read={message.read}
            isOwn={isOwn}
          />
        )}

        {open && (
          <MessageMenu
            isOwn={isOwn}
            openUpwards={openUpwards}
            onEdit={menuDisabled ? undefined : handleEdit}
            onDelete={menuDisabled ? undefined : handleDelete}
            onCopy={menuDisabled ? undefined : handleCopy}
          />
        )}
      </div>
    </div>
  );
}
