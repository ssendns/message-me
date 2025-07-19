import { useEffect, useState } from "react";
import { getAllUsers, getMessagesWithUser } from "../services/api";

export default function ChatList({ token, currentChat, onSelect }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const users = await getAllUsers(token);

        const chatData = await Promise.all(
          users.map(async (user) => {
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
    };

    fetchChats();
  }, [token]);

  return (
    <div className="space-y-1 px-2 pt-2 overflow-y-auto h-full">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelect(chat)}
          className={`cursor-pointer rounded-xl px-4 py-3 transition-all duration-150 ${
            chat.username === currentChat
              ? "bg-primary text-white"
              : "hover:bg-gray-100"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="font-medium text-base">{chat.username}</div>
            {chat.time && (
              <div className="text-xs text-muted mt-1">
                {new Date(chat.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>

          <div
            className={`text-sm truncate ${
              chat.username === currentChat ? "text-white/90" : "text-gray-500"
            }`}
          >
            {chat.lastMessage}
          </div>
        </div>
      ))}
    </div>
  );
}
