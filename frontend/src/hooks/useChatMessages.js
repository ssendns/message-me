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
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.emit("leave_chat", toId.toString());
    };
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

  return { messages, setMessages };
}
