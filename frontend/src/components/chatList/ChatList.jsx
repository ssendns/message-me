import { useState, useEffect, useRef, useCallback } from "react";
import useSocket from "../../hooks/useSocket";
import useChatList from "../../hooks/useChatList";
import ChatListItem from "./ChatListItem";

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
  const pendingTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const isChatOnline = useCallback(
    (item) => {
      const isGroup = String(item.type || "").toUpperCase() === "GROUP";
      if (isGroup) return false;

      const others = (item.participants || [])
        .map((p) => String(p.id))
        .filter((id) => id !== String(currentUserId));

      return others.some((id) => onlineUserIds.includes(id));
    },
    [currentUserId, onlineUserIds]
  );

  const handleSelect = useCallback(
    (item) => {
      if (!item.isNew) {
        onSelect(item);
        markChatRead(item.id);
        return;
      }

      if (!socket) return;
      const peerId = item.participants?.[0]?.id;
      if (!peerId) return;

      if (pendingPeerId && pendingPeerId === peerId) return;
      setPendingPeerId(peerId);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        setPendingPeerId((curr) => (curr === peerId ? null : curr));
      }, 8000);
      socket.once("chat_ready", ({ chatId, peerId: returnedPeerId }) => {
        if (returnedPeerId !== peerId) return;
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        setPendingPeerId(null);

        onSelect({
          id: chatId,
          type: "DIRECT",
          displayName: item.displayName,
          participants: item.participants,
          lastMessageText: "",
          lastMessageImageUrl: null,
          time: null,
          unreadCount: 0,
          hasUnread: false,
        });
      });

      socket.emit("get_or_create_chat", { peerId });
    },
    [socket, onSelect, markChatRead, pendingPeerId]
  );

  return (
    <div className="space-y-1 px-2 pt-2 overflow-y-auto h-full">
      {chats.map((it) => (
        <ChatListItem
          key={it.id}
          chat={it}
          currentUserId={currentUserId}
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
