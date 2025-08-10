import { useEffect, useMemo, useState, useCallback } from "react";
import { getAllChats, getAllUsers } from "../services/api";
import useSocket from "../hooks/useSocket";

const sortByTimeDesc = (list) =>
  [...list].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

export default function useChatList(
  token,
  currentUserId,
  currentChat,
  searchTerm
) {
  const [chats, setChats] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const { socket } = useSocket();

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const chatList = await getAllChats(token);
      const mapped = (chatList || []).map((chat) => {
        const last = chat.lastMessage || null;
        const others = (chat.participants || []).filter(
          (p) => p.id !== currentUserId
        );
        return {
          id: chat.id,
          type: chat.type,
          participants: chat.participants,
          displayName:
            chat.type === "PUBLIC"
              ? chat.title || others.map((p) => p.username).join(", ")
              : others.map((p) => p.username).join(", "),
          lastMessageText: last?.text ?? "",
          lastMessageImageUrl: last?.imageUrl ?? "",
          lastMessageId: last?.id ?? null,
          time: last?.createdAt ?? null,
          unreadCount: chat.unreadCount ?? 0,
          hasUnread: (chat.unreadCount ?? 0) > 0,
        };
      });
      setChats(sortByTimeDesc(mapped));
    } catch (e) {
      console.error("failed to load chats:", e);
    }
  }, [token, currentUserId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("get_online_users");

    const handleOnlineUsers = (ids) => setOnlineUserIds(ids.map(String));
    const handleUserOnline = (userId) =>
      setOnlineUserIds((prev) => [...new Set([...prev, String(userId)])]);
    const handleUserOffline = (userId) =>
      setOnlineUserIds((prev) => prev.filter((id) => id !== String(userId)));

    socket.on("online_users", handleOnlineUsers);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [socket]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      const s = (searchTerm || "").trim().toLowerCase();
      if (!token || !s) {
        setSuggestedUsers([]);
        return;
      }
      try {
        const all = await getAllUsers(token);
        const chattedIds = new Set(
          chats.flatMap((c) => c.participants?.map((p) => p.id) || [])
        );
        const items = all
          .filter((u) => u.id !== currentUserId)
          .filter((u) => !chattedIds.has(u.id))
          .filter((u) => (u.username || "").toLowerCase().includes(s))
          .map((u) => ({
            id: `user-${u.id}`,
            isNew: true,
            displayName: u.username,
            participants: [{ id: u.id, username: u.username }],
          }));
        if (!ignore) setSuggestedUsers(items);
      } catch (e) {
        console.error("failed to load users:", e);
        if (!ignore) setSuggestedUsers([]);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [token, searchTerm, currentUserId, chats]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({
      chatId,
      fromId,
      text,
      imageUrl,
      createdAt,
      id,
    }) => {
      const isOwn = fromId === currentUserId;
      const isOpen = String(chatId) === String(currentChat?.id);

      setChats((prev) =>
        sortByTimeDesc(
          prev.map((chat) =>
            String(chat.id) === String(chatId)
              ? {
                  ...chat,
                  lastMessageText: text ?? "",
                  lastMessageImageUrl: imageUrl ?? null,
                  lastMessageId: id,
                  time: createdAt || new Date().toISOString(),
                  unreadCount: isOwn
                    ? chat.unreadCount || 0
                    : isOpen
                    ? 0
                    : (chat.unreadCount || 0) + 1,
                  hasUnread: isOwn ? chat.hasUnread : !isOpen,
                }
              : chat
          )
        )
      );
    };

    const handleDeleted = ({
      id: messageId,
      chatId,
      nextLast,
      unreadCount,
    }) => {
      setChats((prev) =>
        sortByTimeDesc(
          prev.map((chat) => {
            if (String(chat.id) !== String(chatId)) return chat;
            const isLastDeleted = chat.lastMessageId === messageId;

            const updated = isLastDeleted
              ? nextLast
                ? {
                    ...chat,
                    lastMessageText: nextLast.text ?? "",
                    lastMessageImageUrl: nextLast.imageUrl ?? null,
                    lastMessageId: nextLast.id ?? null,
                    time: nextLast.createdAt ?? null,
                  }
                : {
                    ...chat,
                    lastMessageText: "",
                    lastMessageImageUrl: null,
                    lastMessageId: null,
                    time: null,
                  }
              : chat;

            const uc = unreadCount ?? updated.unreadCount ?? 0;
            return { ...updated, unreadCount: uc, hasUnread: uc > 0 };
          })
        )
      );
    };

    const handleEdited = ({
      chatId,
      id,
      text,
      imageUrl,
      createdAt,
      fromId,
    }) => {
      const isOwn = fromId === currentUserId;
      const isOpen = String(chatId) === String(currentChat?.id);

      setChats((prev) =>
        sortByTimeDesc(
          prev.map((chat) =>
            chat.lastMessageId === id
              ? {
                  ...chat,
                  lastMessageText: text ?? "",
                  lastMessageImageUrl: imageUrl ?? null,
                  time: createdAt || new Date().toISOString(),
                  hasUnread: isOwn ? chat.hasUnread : !isOpen,
                }
              : chat
          )
        )
      );
    };

    const handleMessagesRead = ({ chatId, userId: readerId }) => {
      if (readerId === currentUserId) {
        setChats((prev) =>
          prev.map((c) =>
            String(c.id) === String(chatId)
              ? { ...c, unreadCount: 0, hasUnread: false }
              : c
          )
        );
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_deleted", handleDeleted);
    socket.on("receive_edited_message", handleEdited);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_deleted", handleDeleted);
      socket.off("receive_edited_message", handleEdited);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, currentUserId, currentChat?.id]);

  const listForUI = useMemo(() => {
    const s = (searchTerm || "").toLowerCase().trim();
    const base = !s
      ? chats
      : chats.filter((c) =>
          (c.displayName || "chat").toLowerCase().includes(s)
        );
    return sortByTimeDesc(base).concat(s ? suggestedUsers : []);
  }, [chats, suggestedUsers, searchTerm]);

  const markChatRead = useCallback((chatId) => {
    setChats((prev) => {
      let changed = false;
      const next = prev.map((c) => {
        if (String(c.id) !== String(chatId)) return c;
        changed = true;
        return { ...c, unreadCount: 0, hasUnread: false };
      });
      return changed ? next : prev;
    });
  }, []);

  return {
    chats: listForUI,
    onlineUserIds,
    refreshChats: fetchChats,
    markChatRead,
  };
}
