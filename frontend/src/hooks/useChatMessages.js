import { useEffect, useState, useRef, useCallback } from "react";
import { getChatMessages } from "../services/api";
import useSocket from "./useSocket";
import SOCKET_EVENTS from "../services/socketEvents";
const PAGE = 30;

export default function useChatMessages({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [firstUnreadId, setFirstUnreadId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const oldestCursorRef = useRef(null);
  const { socket } = useSocket();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!chatId || !token) return;
    setMessages([]);
    setHasMore(true);
    oldestCursorRef.current = null;
    setFirstUnreadId(null);

    (async () => {
      setInitialLoading(true);
      try {
        const data = await getChatMessages({
          chatId,
          token,
          limit: PAGE,
          direction: "older",
        });
        const list = Array.isArray(data.messages) ? data.messages : [];

        const firstUnread = list.find(
          (m) => m.fromId !== currentUserId && !m.read
        );
        setFirstUnreadId(firstUnread?.id ?? null);

        setMessages(list);
        oldestCursorRef.current = data.nextCursor ?? null;
        setHasMore(Boolean(data.nextCursor));
      } catch (err) {
        console.error("failed to fetch messages:", err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [chatId, token, currentUserId]);

  const loadOlder = useCallback(async () => {
    if (!chatId || !token || !hasMore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const data = await getChatMessages({
        chatId,
        token,
        limit: PAGE,
        cursor: oldestCursorRef.current,
        direction: "older",
      });
      const chunk = Array.isArray(data.messages) ? data.messages : [];
      if (chunk.length > 0) {
        setMessages((prev) => [...chunk, ...prev]);
        oldestCursorRef.current = data.nextCursor ?? null;
        setHasMore(Boolean(data.nextCursor));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("load older failed:", err);
    } finally {
      setLoadingOlder(false);
    }
  }, [chatId, token, hasMore, loadingOlder]);

  useEffect(() => {
    if (!chatId || !currentUserId || !socket) return;

    socket.emit(SOCKET_EVENTS.JOIN_CHAT, { chatId: Number(chatId) });

    const handleReceiveMessage = (message) => {
      if (String(message.chatId) !== String(chatId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const next = [...prev, message];
        if (message.fromId !== currentUserId && !message.read) {
          socket.emit("read_messages", { chatId: Number(chatId) });
          return next.map((m) =>
            String(m.chatId) === String(chatId) && m.fromId !== currentUserId
              ? { ...m, read: true }
              : m
          );
        }
        return next;
      });
    };

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);

    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.emit(SOCKET_EVENTS.LEAVE_CHAT, { chatId: Number(chatId) });
    };
  }, [socket, currentUserId, chatId]);

  useEffect(() => {
    if (!socket || !chatId || !currentUserId) return;

    const handleMessagesRead = ({ chatId: cid, readerId }) => {
      if (String(cid) !== String(chatId)) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (String(m.chatId) !== String(chatId)) return m;
          if (readerId === currentUserId && m.fromId !== currentUserId) {
            return { ...m, read: true };
          }
          if (readerId !== currentUserId && m.fromId === currentUserId) {
            return { ...m, read: true };
          }
          return m;
        })
      );
    };

    socket.on(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
    return () => socket.off("messages_read", handleMessagesRead);
  }, [socket, chatId, currentUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleEditedMessage = ({
      id,
      chatId: cid,
      text,
      imageUrl,
      imagePublicId,
      edited,
    }) => {
      if (String(cid) !== String(chatId)) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id
            ? {
                ...message,
                text,
                imageUrl,
                imagePublicId,
                edited: Boolean(edited),
              }
            : message
        )
      );
    };

    const handleDeletedMessage = ({ id, chatId: cid }) => {
      if (String(cid) !== String(chatId)) return;
      setMessages((prev) => prev.filter((message) => message.id !== id));
    };

    socket.on(SOCKET_EVENTS.RECEIVE_EDITED_MESSAGE, handleEditedMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleDeletedMessage);
    return () => {
      socket.off(SOCKET_EVENTS.RECEIVE_EDITED_MESSAGE, handleEditedMessage);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleDeletedMessage);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket || !chatId || !currentUserId || messages.length === 0) return;

    const hasUnreadIncoming = messages.some(
      (message) =>
        String(message.chatId) === String(chatId) &&
        message.fromId !== currentUserId &&
        !message.read
    );
    if (hasUnreadIncoming) {
      socket.emit("read_messages", { chatId });
      setMessages((prev) =>
        prev.map((message) =>
          String(message.chatId) === String(chatId) &&
          message.fromId !== currentUserId
            ? { ...message, read: true }
            : message
        )
      );
    }
  }, [socket, chatId, currentUserId, messages]);

  return {
    messages,
    setMessages,
    initialLoading,
    loadingOlder,
    hasMore,
    loadOlder,
    firstUnreadId,
  };
}
