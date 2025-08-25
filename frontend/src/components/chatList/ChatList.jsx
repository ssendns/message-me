import { useState, useEffect, useRef, useCallback } from "react";
import useChatList from "../../hooks/useChatList";
import ChatListItem from "./ChatListItem";
import { createDirectChat } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function ChatList({ currentChat, onSelect, searchTerm }) {
  const { token, user } = useAuth();
  const currentUserId = user?.id;

  const { chats, onlineUserIds, markChatRead } = useChatList(
    currentChat,
    searchTerm
  );
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
    async (item) => {
      if (!item.isNew) {
        onSelect(item);
        markChatRead(item.id);
        return;
      }

      const peerId = item.participants?.[0]?.id;
      if (!peerId || !token) return;

      if (pendingPeerId && pendingPeerId === peerId) return;
      setPendingPeerId(peerId);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        setPendingPeerId((curr) => (curr === peerId ? null : curr));
      }, 8000);
      try {
        const { id: chatId } = await createDirectChat({ peerId, token });
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
      } catch (err) {
        console.error("failed to create/get direct chat:", err);
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
        setPendingPeerId(null);
      }
    },
    [token, onSelect, markChatRead, pendingPeerId]
  );

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
