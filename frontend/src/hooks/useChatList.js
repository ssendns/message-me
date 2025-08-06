import { useEffect, useState, useCallback } from "react";
import { getAllUsers, getMessagesWithUser } from "../services/api";
import useSocket from "../hooks/useSocket";

export default function useChatList(token, currentUserId) {
  const [chats, setChats] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit("get_online_users");

    socket.on("online_users", (ids) => {
      setOnlineUserIds(ids.map(String));
    });

    socket.on("user_online", (userId) => {
      setOnlineUserIds((prev) => [...new Set([...prev, String(userId)])]);
    });

    socket.on("user_offline", (userId) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== String(userId)));
    });

    return () => {
      socket.off("online_users");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, [socket]);

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

    const handleEdit = () => {
      fetchChats();
    };

    socket.on("receive_message", handleReceive);
    socket.on("delete_message", handleDelete);
    socket.on("receive_edited_message", handleEdit);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("delete_message", handleDelete);
      socket.off("edit_message", handleEdit);
    };
  }, [socket, currentUserId, fetchChats]);

  return { chats, onlineUserIds, refreshChats: fetchChats };
}
