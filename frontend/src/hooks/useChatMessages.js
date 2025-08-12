import { useEffect, useState, useRef, useCallback } from "react";
import { getChatMessages } from "../services/api";
import useSocket from "./useSocket";
const PAGE = 30;

export default function useChatMessages({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const oldestCursorRef = useRef(null);
  const { socket } = useSocket();
  const token = localStorage.getItem("token");

  const readSentRef = useRef(false);

  useEffect(() => {
    if (!chatId || !token) return;
    readSentRef.current = false;
    oldestCursorRef.current = null;
    setMessages([]);
    setHasMore(true);

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
        setMessages(list);
        oldestCursorRef.current = data.nextCursor;
        setHasMore(Boolean(data.nextCursor));
      } catch (err) {
        console.error("failed to fetch messages:", err);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [chatId, token]);

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
        oldestCursorRef.current = data.nextCursor;
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

    socket.emit("join_chat", { chatId: Number(chatId) });

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

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.emit("leave_chat", { chatId: Number(chatId) });
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

    socket.on("messages_read", handleMessagesRead);
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

    socket.on("receive_edited_message", handleEditedMessage);
    socket.on("message_deleted", handleDeletedMessage);
    return () => {
      socket.off("receive_edited_message", handleEditedMessage);
      socket.off("message_deleted", handleDeletedMessage);
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
  };
}
