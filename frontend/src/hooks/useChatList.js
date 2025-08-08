import { useEffect, useState, useCallback } from "react";
import { getAllUsers, getMessagesWithUser } from "../services/api";
import useSocket from "../hooks/useSocket";

const sortByTimeDesc = (list) =>
  [...list].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

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
              lastMessageContent: lastMessage?.content ?? "",
              lastMessageImageUrl: lastMessage?.imageUrl ?? "",
              lastMessageId: lastMessage?.id ?? null,
              time: lastMessage?.createdAt ?? null,
              hasUnread: (unreadCount ?? 0) > 0,
              unreadCount: unreadCount ?? 0,
            };
          })
      );
      setChats(
        sortByTimeDesc(
          chatData.filter(
            (chat) => chat.lastMessageContent || chat.lastMessageImageUrl
          )
        )
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

    const handleReceive = ({
      fromId,
      toId,
      content,
      imageUrl,
      createdAt,
      id,
    }) => {
      const otherUserId = fromId === currentUserId ? toId : fromId;
      const isOwn = fromId === currentUserId;
      const isOpen = String(otherUserId) === String(currentChat?.id);

      setChats((prev) =>
        sortByTimeDesc(
          prev.map((chat) =>
            String(chat.id) === String(otherUserId)
              ? {
                  ...chat,
                  lastMessageContent: content ?? "",
                  lastMessageImageUrl: imageUrl ?? null,
                  lastMessageId: id,
                  time: createdAt || new Date().toISOString(),
                  hasUnread: !isOwn && !isOpen,
                  unreadCount: isOwn
                    ? chat.unreadCount || 0
                    : (chat.unreadCount || 0) + 1,
                }
              : chat
          )
        )
      );
    };

    const handleDelete = async ({ messageId, chatId }) => {
      setChats((prev) =>
        prev.map((chat) =>
          String(chat.id) === String(chatId) && chat.lastMessageId === messageId
            ? {
                ...chat,
                lastMessageContent: "",
                lastMessageImageUrl: null,
                lastMessageId: null,
                time: null,
                hasUnread: false,
              }
            : chat
        )
      );
      try {
        const { messages } = await getMessagesWithUser(chatId, token);
        const last = messages.at(-1);

        setChats((prev) =>
          prev
            .map((chat) =>
              String(chat.id) === String(chatId)
                ? last
                  ? {
                      ...chat,
                      lastMessageContent: last.content ?? "",
                      lastMessageImageUrl: last.imageUrl ?? null,
                      lastMessageId: last.id,
                      time: last.createdAt ?? null,
                    }
                  : {
                      ...chat,
                      lastMessageContent: "",
                      lastMessageImageUrl: null,
                      lastMessageId: null,
                      time: null,
                    }
                : chat
            )
            .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
        );
      } catch (err) {
        console.error("error fetching messages on delete:", err);
      }
    };

    const handleEdit = ({ fromId, toId, content, imageUrl, createdAt, id }) => {
      const otherUserId = fromId === currentUserId ? toId : fromId;
      const isOwn = fromId === currentUserId;
      const isOpen = String(otherUserId) === String(currentChat?.id);

      setChats((prev) =>
        sortByTimeDesc(
          prev.map((chat) =>
            chat.lastMessageId === id
              ? {
                  ...chat,
                  lastMessageContent: content ?? "",
                  lastMessageImageUrl: imageUrl ?? null,
                  time: createdAt || new Date().toISOString(),
                  hasUnread: !isOwn && !isOpen,
                }
              : chat
          )
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
  }, [socket, token, currentUserId, currentChat?.id]);

  return { chats, onlineUserIds, refreshChats: fetchChats };
}
