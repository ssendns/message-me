import { useEffect, useState } from "react";
import { getChatMessages } from "../services/api";
import useSocket from "./useSocket";

export default function useChatMessages({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!chatId || !token) return;

    const fetchMessages = async () => {
      try {
        const data = await getChatMessages({ chatId, token });
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } catch (err) {
        console.error("failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [chatId, token]);

  useEffect(() => {
    if (!chatId || !currentUserId || !socket) return;

    socket.emit("join_chat", { chatId });

    const handleReceiveMessage = (message) => {
      if (message.chatId !== chatId) return;

      setMessages((prev) => [...prev, message]);
      if (message.fromId !== currentUserId && !message.read) {
        setMessages((prev) =>
          prev.map((m) =>
            m.chatId === chatId && m.fromId !== currentUserId
              ? { ...m, read: true }
              : m
          )
        );
        socket.emit("read_messages", { chatId });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.emit("leave_chat", chatId);
    };
  }, [socket, currentUserId, chatId]);

  useEffect(() => {
    if (!socket || !chatId || !currentUserId) return;

    const handleMessagesRead = ({ chatId: cid, readerId }) => {
      if (cid !== chatId) return;
      if (readerId !== currentUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.chatId === chatId && m.fromId === currentUserId
              ? { ...m, read: true }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.chatId === chatId && m.fromId !== currentUserId
              ? { ...m, read: true }
              : m
          )
        );
      }
    };

    socket.on("messages_read", handleMessagesRead);
    return () => socket.off("messages_read", handleMessagesRead);
  }, [socket, currentUserId, chatId]);

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
      if (cid !== chatId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, text, imageUrl, imagePublicId, edited: Boolean(edited) }
            : m
        )
      );
    };

    socket.on("receive_edited_message", handleEditedMessage);
    return () => socket.off("receive_edited_message", handleEditedMessage);
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket) return;

    const handleDeletedMessage = ({ id, chatId: cid }) => {
      if (cid !== chatId) return;
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    socket.on("message_deleted", handleDeletedMessage);
    return () => socket.off("message_deleted", handleDeletedMessage);
  }, [socket, chatId]);

  useEffect(() => {
    if (!socket || !chatId || !currentUserId || messages.length === 0) return;
    const hasUnreadIncoming = messages.some(
      (m) => m.chatId === chatId && m.fromId !== currentUserId && !m.read
    );
    if (hasUnreadIncoming) {
      socket.emit("read_messages", { chatId });
      setMessages((prev) =>
        prev.map((m) =>
          m.chatId === chatId && m.fromId !== currentUserId
            ? { ...m, read: true }
            : m
        )
      );
    }
  }, [socket, chatId, currentUserId, messages]);

  return { messages, setMessages };
}
