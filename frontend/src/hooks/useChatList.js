import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getAllChats, getAllUsers } from "../services/api";
import useSocket from "../hooks/useSocket";

const sortByTimeDesc = (list) =>
  [...list].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

const safeUpper = (v) => String(v || "").toUpperCase();

function mapApiChat(chat, currentUserId) {
  const last = chat.lastMessage || null;
  const participants = chat.participants || [];
  const others = participants.filter((p) => p.id !== currentUserId);
  const isGroup = safeUpper(chat.type) === "GROUP";
  const fallbackName = others.map((p) => p.username).join(", ");
  const displayName = isGroup
    ? (chat.title && chat.title.trim()) || fallbackName
    : fallbackName;

  return {
    id: chat.id,
    type: chat.type,
    isGroup,
    membersCount: participants.length,
    participants,
    displayName,
    lastMessageText: last?.text ?? "",
    lastMessageImageUrl: last?.imageUrl ?? "",
    lastMessageId: last?.id ?? null,
    time: last?.createdAt ?? null,
    unreadCount: chat.unreadCount ?? 0,
    hasUnread: (chat.unreadCount ?? 0) > 0,
  };
}

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

  const searchRef = useRef("");
  searchRef.current = (searchTerm || "").trim().toLowerCase();

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const chatList = await getAllChats(token);
      const mapped = (chatList || []).map((c) => mapApiChat(c, currentUserId));
      setChats(sortByTimeDesc(mapped));
    } catch (err) {
      console.error("failed to load chats:", err);
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
    let cancelled = false;

    const run = async () => {
      const search = (searchTerm || "").trim().toLowerCase();
      if (!token || !search) {
        setSuggestedUsers([]);
        return;
      }
      try {
        const all = await getAllUsers(token);
        if (cancelled) return;

        const chattedIds = new Set(
          chats.flatMap(
            (chat) =>
              chat.participants?.map((participant) => participant.id) || []
          )
        );

        const items = all
          .filter((user) => user.id !== currentUserId)
          .filter((user) => !chattedIds.has(user.id))
          .filter((user) =>
            (user.username || "").toLowerCase().includes(search)
          )
          .map((user) => ({
            id: `user-${user.id}`,
            isNew: true,
            displayName: user.username,
            participants: [{ id: user.id, username: user.username }],
          }));
        if (!cancelled) setSuggestedUsers(items);
      } catch (err) {
        console.error("failed to load users:", err);
        if (!cancelled) setSuggestedUsers([]);
      }
    };
    run();
    return () => {
      cancelled = true;
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

    const handleMessagesRead = ({ chatId, readerId }) => {
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
    const search = (searchTerm || "").toLowerCase().trim();

    const base = !search
      ? chats
      : chats.filter((chat) =>
          (chat.displayName || "chat").toLowerCase().includes(search)
        );

    const withSuggestions = search ? base.concat(suggestedUsers) : base;

    return sortByTimeDesc(withSuggestions);
  }, [chats, suggestedUsers, searchTerm]);

  const markChatRead = useCallback((chatId) => {
    setChats((prev) => {
      let changed = false;
      const next = prev.map((chat) => {
        if (String(chat.id) !== String(chatId)) return chat;
        changed = true;
        return { ...chat, unreadCount: 0, hasUnread: false };
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
