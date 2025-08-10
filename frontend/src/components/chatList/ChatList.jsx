import useChatList from "../../hooks/useChatList";
import ChatListItem from "./ChatListItem";
import useSocket from "../../hooks/useSocket";
import { useState, useEffect, useRef } from "react";

export default function ChatList({
  token,
  currentUserId,
  currentChat,
  onSelect,
  searchTerm,
}) {
  const { chats, onlineUserIds, markChatRead } = useChatList(
    token,
    currentUserId,
    currentChat,
    searchTerm
  );
  const { socket } = useSocket();
  const [pendingPeerId, setPendingPeerId] = useState(null);
  const pendingHandlerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (socket && pendingHandlerRef.current) {
        socket.off("chat_ready", pendingHandlerRef.current);
        pendingHandlerRef.current = null;
      }
    };
  }, [socket]);

  const isChatOnline = (item) => {
    if ((item.type || "").toUpperCase() === "GROUP") {
      return false;
    }

    const others = (item.participants || [])
      .map((p) => String(p.id))
      .filter((id) => id !== String(currentUserId));

    return others.some((id) => onlineUserIds.includes(id));
  };

  const handleSelect = (item) => {
    if (!item.isNew) {
      onSelect(item);
      markChatRead(item.id);
      return;
    }

    if (!socket) return;

    const peerId = item.participants?.[0]?.id;
    if (!peerId) return;

    if (pendingPeerId && pendingPeerId !== peerId) return;

    setPendingPeerId(peerId);

    const onReady = ({ chatId, peerId: returnedPeerId }) => {
      if (returnedPeerId !== peerId) return;

      setPendingPeerId(null);
      if (socket && pendingHandlerRef.current) {
        socket.off("chat_ready", pendingHandlerRef.current);
        pendingHandlerRef.current = null;
      }

      onSelect({
        id: chatId,
        type: "PRIVATE",
        displayName: item.displayName,
        participants: item.participants,
        lastMessageText: "",
        lastMessageImageUrl: null,
        time: null,
        unreadCount: 0,
        hasUnread: false,
      });
    };

    pendingHandlerRef.current = onReady;
    socket.on("chat_ready", onReady);

    socket.emit("get_or_create_chat", { peerId });
  };

  return (
    <div className="space-y-1 px-2 pt-2 overflow-y-auto h-full">
      {chats.map((it) => (
        <ChatListItem
          key={it.id}
          chat={it}
          isActive={String(it.id) === String(currentChat?.id)}
          isOnline={isChatOnline(it)}
          onClick={() => handleSelect(it)}
          waiting={
            it.isNew &&
            pendingPeerId &&
            it.participants?.[0]?.id === pendingPeerId
          }
        />
      ))}

      {chats.length === 0 && (
        <p className="text-muted text-center py-4 text-sm">no chats found</p>
      )}
    </div>
  );
}
