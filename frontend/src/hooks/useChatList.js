import { useEffect, useState, useCallback } from "react";
import { getAllUsers, getMessagesWithUser } from "../services/api";
import useSocket from "../hooks/useSocket";

export default function useChatList(token, currentUserId) {
  const [chats, setChats] = useState([]);
  const { socket } = useSocket();

  const fetchChats = useCallback(async () => {
    if (!token) return;

    try {
      const users = await getAllUsers(token);

      const chatData = await Promise.all(
        users
          .filter((user) => user.id !== currentUserId)
          .map(async (user) => {
            const { messages } = await getMessagesWithUser(user.id, token);
            const lastMsg = messages?.slice(-1)[0];
            return {
              id: user.id,
              username: user.username,
              lastMessage: lastMsg?.content || "",
              time: lastMsg?.createdAt || null,
            };
          })
      );

      setChats(chatData);
    } catch (err) {
      console.error("failed to load chats", err);
    }
  }, [token, currentUserId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const handleReceive = ({ fromId, toId, content, createdAt }) => {
      if (fromId === currentUserId || toId === currentUserId) {
        setChats((prev) => {
          const otherUserId = fromId === currentUserId ? toId : fromId;
          return prev.map((chat) =>
            String(chat.id) === String(otherUserId)
              ? {
                  ...chat,
                  lastMessage: content,
                  time: createdAt || new Date().toISOString(),
                }
              : chat
          );
        });
      }
    };

    const handleDelete = () => {
      fetchChats();
    };

    socket.on("receive_message", handleReceive);
    socket.on("delete_message", handleDelete);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("delete_message", handleDelete);
    };
  }, [socket, currentUserId, fetchChats]);

  return { chats, refreshChats: fetchChats };
}
