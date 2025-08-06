import useChatList from "../hooks/useChatList";
import ChatListItem from "./ChatListItem";

export default function ChatList({ token, currentChat, onSelect }) {
  const currentUserId = Number(localStorage.getItem("id"));
  const { chats, onlineUserIds } = useChatList(token, currentUserId);

  return (
    <div className="space-y-1 px-2 pt-2 overflow-y-auto h-full">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.username === currentChat}
          isOnline={onlineUserIds.includes(String(chat.id))}
          onClick={() => onSelect(chat)}
        />
      ))}
    </div>
  );
}
