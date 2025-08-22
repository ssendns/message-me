import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "./ChatBox";
import ImageSendModal from "./ImageSendModal";
import useChatMessages from "../../hooks/useChatMessages";
import useSendMessage from "../../hooks/useSendMessage";
import useUploadImage from "../../hooks/useUploadImage";
import { Paperclip, Info } from "lucide-react";
import GroupInfoDrawer from "../GroupInfoDrawer";

export default function ChatArea({
  displayName,
  chatId,
  currentUserId,
  currentUserRole,
  participants,
  type,
  onBack,
}) {
  const [messageText, setMessageText] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const navigate = useNavigate();

  const isGroup = useMemo(
    () => String(type || "").toUpperCase() === "GROUP",
    [type]
  );

  const handleOpenInfo = useCallback(() => {
    if (isGroup) setInfoOpen(true);
  }, [isGroup]);

  const handleEditGroup = useCallback(() => navigate(`/chats/${chatId}/edit`));

  const { messages, loadingOlder, hasMore, loadOlder, firstUnreadId } =
    useChatMessages({
      chatId,
      currentUserId,
    });
  const { sendMessage } = useSendMessage(currentUserId);
  const { uploadImage, loading, error } = useUploadImage();
  const membersCount = useMemo(() => participants.length, [participants]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSend = useCallback(() => {
    const text = messageText.trim();
    if (!chatId || !text) return;

    sendMessage({ chatId, text });
    setMessageText("");
  }, [chatId, messageText, sendMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPickedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPickerOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setPickerOpen(false);
    setPickedFile(null);
    setMessageText("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleModalSend = useCallback(
    async (caption) => {
      if (!pickedFile || !chatId) return;
      try {
        const uploaded = await uploadImage(pickedFile);
        if (uploaded?.url) {
          sendMessage({
            chatId,
            text: caption?.trim() ? caption : " ",
            imageUrl: uploaded.url,
            imagePublicId: uploaded.publicId,
          });
        }
      } finally {
        handleModalClose();
      }
    },
    [pickedFile, chatId, uploadImage, sendMessage, handleModalClose]
  );

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center justify-between px-6 py-3 mb-1 border-b border-gray-200 bg-white shadow-sm">
        <button
          onClick={onBack}
          className="lg:hidden text-muted hover:text-primary"
        >
          ←
        </button>
        <div className="mx-auto lg:mx-0 flex flex-col items-center lg:items-start">
          <h1 className="text-lg font-semibold text-primary">
            {displayName || "chat"}
          </h1>
          {isGroup && (
            <span className="text-xs text-gray-500">
              {membersCount} {membersCount === 1 ? "member" : "members"}
            </span>
          )}
        </div>
        {isGroup && (
          <button
            onClick={handleOpenInfo}
            className="p-2 rounded-full hover:bg-gray-100 ml-2"
            title="Group info"
            aria-label="Group info"
          >
            <Info size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 bg-gray-50">
        <ChatBox
          messages={messages}
          currentUserId={currentUserId}
          participants={participants}
          isGroup={String(type).toUpperCase() === "GROUP"}
          hasMore={hasMore}
          loadingMore={loadingOlder}
          onLoadMore={loadOlder}
          firstUnreadId={firstUnreadId}
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
          placeholder="type your message..."
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
      <ImageSendModal
        text={messageText}
        open={pickerOpen}
        filePreview={previewUrl}
        uploading={loading}
        onClose={handleModalClose}
        onSend={handleModalSend}
      />
      {error && <div className="px-6 pb-3 text-xs text-red-600">{error}</div>}
      {isGroup && infoOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setInfoOpen(false)}
        />
      )}
      {isGroup && (
        <GroupInfoDrawer
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          chat={{
            id: chatId,
            type,
            title: displayName,
            participants: participants,
          }}
          currentUserRole={currentUserRole}
          membersCount={membersCount}
          currentUserId={currentUserId}
          onEdit={handleEditGroup}
        />
      )}
    </div>
  );
}
