import { useEffect, useState, useCallback } from "react";
import { getAllUsers, getMessagesWithUser } from "../services/api";
import useSocket from "../hooks/useSocket";

export default function useChatList(token, currentUserId, currentChat) {
  const [chats, setChats] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    if (!currentChat) return;

    setChats((prev) =>
      prev.map((chat) =>
        String(chat.id) === String(currentChat.id)
          ? { ...chat, hasUnread: false, unreadCount: 0 }
          : chat
      )
    );
  }, [currentChat]);

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

  const fetchChats = useCallback(async () => {
    if (!token) return;

    try {
      const users = await getAllUsers(token);

      const chatData = await Promise.all(
        users
          .filter((user) => user.id !== currentUserId)
          .map(async (user) => {
            const { messages, unreadCount } = await getMessagesWithUser(
              user.id,
              token
            );
            const lastMessage = messages?.at(-1);

            return {
              id: user.id,
              username: user.username,
              lastMessage: lastMessage?.content || "",
              lastMessageId: lastMessage?.id || null,
              time: lastMessage?.createdAt || null,
              hasUnread: unreadCount > 0,
              unreadCount,
            };
          })
      );

      setChats(
        chatData.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      );
    } catch (err) {
      console.error("failed to load chats:", err);
    }
  }, [token, currentUserId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = ({ fromId, toId, content, createdAt, id }) => {
      const otherUserId = fromId === currentUserId ? toId : fromId;
      const isOwn = fromId === currentUserId;
      const isOpen = String(otherUserId) === String(currentChat?.id);

      setChats((prev) => {
        const updated = prev.map((chat) =>
          String(chat.id) === String(otherUserId)
            ? {
                ...chat,
                lastMessage: content,
                lastMessageId: id,
                time: createdAt || new Date().toISOString(),
                hasUnread: !isOwn && !isOpen,
                unreadCount: isOwn
                  ? chat.unreadCount || 0
                  : (chat.unreadCount || 0) + 1,
              }
            : chat
        );

        return updated.sort(
          (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
        );
      });
    };

    const handleDelete = async ({ messageId, chatId }) => {
      const updatedChats = await Promise.all(
        chats.map(async (chat) => {
          if (String(chat.id) !== String(chatId)) return chat;
          if (chat.lastMessageId !== messageId) return chat;

          try {
            const { messages } = await getMessagesWithUser(chatId, token);
            const last = messages.at(-1);

            if (!last) {
              return {
                ...chat,
                lastMessage: "",
                lastMessageId: null,
                time: null,
                hasUnread: false,
              };
            }

            const isOwn = last.fromId === currentUserId;
            const isOpen = String(chat.id) === String(currentChat?.id);
            const shouldMarkUnread = !isOwn && !isOpen;

            return {
              ...chat,
              lastMessage: last.content,
              lastMessageId: last.id,
              time: last.createdAt,
              hasUnread: shouldMarkUnread,
            };
          } catch (err) {
            console.error("error fetching messages on delete:", err);
            return chat;
          }
        })
      );

      setChats(
        updatedChats.sort(
          (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
        )
      );
    };

    const handleEdit = ({ fromId, toId, content, createdAt, id }) => {
      const otherUserId = fromId === currentUserId ? toId : fromId;
      const isOwn = fromId === currentUserId;
      const isOpen = String(otherUserId) === String(currentChat?.id);

      setChats((prev) =>
        prev.map((chat) =>
          chat.lastMessageId === id
            ? {
                ...chat,
                lastMessage: content,
                time: createdAt || new Date().toISOString(),
                hasUnread: !isOwn && !isOpen,
              }
            : chat
        )
      );
    };

    socket.on("receive_message", handleReceive);
    socket.on("delete_message", handleDelete);
    socket.on("receive_edited_message", handleEdit);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("delete_message", handleDelete);
      socket.off("receive_edited_message", handleEdit);
    };
  }, [socket, chats, token, currentChat?.id, currentUserId]);

  return {
    chats,
    onlineUserIds,
    refreshChats: fetchChats,
  };
}
