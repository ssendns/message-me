import { useEffect, useState } from "react";
import { getMessagesWithUser } from "../services/api";
import useSocket from "./useSocket";

export default function useChatMessages(currentUserId, toId) {
  const [messages, setMessages] = useState([]);
  const { socket } = useSocket();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!toId || !token) return;

    const loadMessages = async () => {
      try {
        const res = await getMessagesWithUser(toId, token);
        setMessages(res.messages || []);
      } catch (err) {
        console.error("failed to fetch messages:", err);
      }
    };

    loadMessages();
  }, [toId, token]);

  useEffect(() => {
    if (!toId || !currentUserId || !socket) return;

    socket.emit("join", currentUserId);
    socket.emit("join_chat", toId.toString());

    const handleReceive = (message) => {
      if (message.fromId === toId || message.toId === toId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.emit("leave_chat", toId.toString());
    };
  }, [socket, currentUserId, toId]);

  useEffect(() => {
    if (!socket) return;

    const handleDelete = ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    socket.on("delete_message", handleDelete);
    return () => socket.off("delete_message", handleDelete);
  }, [socket]);

  return { messages, setMessages };
}
