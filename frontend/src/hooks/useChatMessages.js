import { useEffect, useState } from "react";
import { getMessagesWithUser } from "../services/api";
import useSocket from "./useSocket";

export default function useChatMessages(currentUserId, toId) {
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!toId || !token) return;

    const fetchMessages = async () => {
      try {
        const { messages } = await getMessagesWithUser(toId, token);
        setMessages(messages || []);
      } catch (err) {
        console.error("failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [toId, token]);

  useEffect(() => {
    if (!toId || !currentUserId || !socket) return;

    socket.emit("join", currentUserId);
    socket.emit("join_chat", toId.toString());

    const handleReceiveMessage = (message) => {
      if (message.fromId === toId || message.toId === toId) {
        setMessages((prev) => [...prev, message]);
        if (message.fromId === toId && message.toId === currentUserId) {
          socket.emit("read_messages", { fromId: toId, toId: currentUserId });
        }
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.emit("leave_chat", toId.toString());
    };
  }, [socket, currentUserId, toId]);

  useEffect(() => {
    if (!socket || !toId || !currentUserId) return;

    const handleMessagesRead = ({ fromId, toId: readerId }) => {
      if (readerId === toId && fromId === currentUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.fromId === currentUserId ? { ...m, read: true } : m
          )
        );
      }
    };

    socket.on("messages_read", handleMessagesRead);
    return () => socket.off("messages_read", handleMessagesRead);
  }, [socket, currentUserId, toId]);

  useEffect(() => {
    if (!socket) return;

    const handleEditedMessage = ({ id, content, imageUrl }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                content: content,
                imageUrl: imageUrl,
                edited: true,
              }
            : m
        )
      );
    };

    socket.on("receive_edited_message", handleEditedMessage);
    return () => socket.off("receive_edited_message", handleEditedMessage);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleDeletedMessage = ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    socket.on("delete_message", handleDeletedMessage);
    return () => socket.off("delete_message", handleDeletedMessage);
  }, [socket]);

  useEffect(() => {
    if (!socket || !toId || !currentUserId || messages.length === 0) return;

    const hasIncomingUnread = messages.some(
      (m) => m.fromId === toId && m.hasUnread
    );
    if (!hasIncomingUnread) return;

    socket.emit("read_messages", { fromId: toId, toId: currentUserId });

    setMessages((prev) =>
      prev.map((m) => (m.fromId === toId ? { ...m, hasUnread: false } : m))
    );
  }, [socket, currentUserId, toId, messages, messages.length]);

  useEffect(() => {
    if (!socket || !toId || !currentUserId) return;

    const handleMessagesRead = ({ fromId, toId: readerId }) => {
      if (fromId === currentUserId && readerId === toId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.fromId === currentUserId ? { ...m, hasUnread: false } : m
          )
        );
      }
    };

    socket.on("messages_read", handleMessagesRead);
    return () => socket.off("messages_read", handleMessagesRead);
  }, [socket, currentUserId, toId]);

  return { messages, setMessages };
}
