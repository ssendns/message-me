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
            const { messages, unreadCount } = await getMessagesWithUser(
              user.id,
              token
            );
            const lastMsg = messages?.slice(-1)[0];
            return {
              id: user.id,
              username: user.username,
              lastMessage: lastMsg?.content || "",
              lastMessageId: lastMsg?.id || null,
              time: lastMsg?.createdAt || null,
              hasUnread: unreadCount > 0,
              unreadCount,
            };
          })
      );

      const sortedChats = [...chatData].sort((a, b) => {
        const aTime = new Date(a.time || 0);
        const bTime = new Date(b.time || 0);
        return bTime - aTime;
      });

      setChats(sortedChats);
    } catch (err) {
      console.error("failed to load chats", err);
    }
  }, [token, currentUserId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const handleReceive = ({ fromId, toId, content, createdAt, id }) => {
      if (fromId === currentUserId || toId === currentUserId) {
        setChats((prev) => {
          const otherUserId = fromId === currentUserId ? toId : fromId;
          const isOwnMessage = fromId === currentUserId;
          const isCurrentChatOpen =
            String(otherUserId) === String(currentChat?.id);
          return prev.map((chat) =>
            String(chat.id) === String(otherUserId)
              ? {
                  ...chat,
                  lastMessage: content,
                  lastMessageId: id,
                  time: createdAt || new Date().toISOString(),
                  hasUnread: !isOwnMessage && !isCurrentChatOpen,
                  unreadCount: isOwnMessage
                    ? chat.unreadCount || 0
                    : (chat.unreadCount || 0) + 1,
                }
              : chat
          );
        });
      }
    };

    const handleDelete = async ({ messageId, chatId }) => {
      const updated = await Promise.all(
        chats.map(async (chat) => {
          if (String(chat.id) !== String(chatId)) return chat;
          if (chat.lastMessageId !== messageId) return chat;

          try {
            const { messages } = await getMessagesWithUser(chatId, token);
            console.log("messages after deletion", messages);
            const last = messages[messages.length - 1];

            if (!last) {
              console.log("oooo");
              return {
                ...chat,
                lastMessage: "",
                lastMessageId: null,
                time: null,
                hasUnread: false,
              };
            }

            console.log("lalala");

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
            console.error("Error fetching messages on delete:", err);
            return chat;
          }
        })
      );

      setChats(updated);
    };

    const handleEdit = ({ fromId, toId, content, createdAt, id }) => {
      const otherUserId = fromId === currentUserId ? toId : fromId;
      const isOwnMessage = fromId === currentUserId;
      const isCurrentChatOpen = String(otherUserId) === String(currentChat?.id);

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.lastMessageId !== id) return chat;

          return {
            ...chat,
            lastMessage: content,
            time: createdAt || new Date().toISOString(),
            hasUnread: !isOwnMessage && !isCurrentChatOpen,
          };
        })
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
  }, [socket, currentUserId, fetchChats, currentChat?.id, chats, token]);

  return { chats, onlineUserIds, refreshChats: fetchChats };
}
