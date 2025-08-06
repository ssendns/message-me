import useChatList from "../hooks/useChatList";
import ChatListItem from "./ChatListItem";

export default function ChatList({ token, currentChat, onSelect, searchTerm }) {
  const currentUserId = Number(localStorage.getItem("id"));
  const { chats, onlineUserIds } = useChatList(token, currentUserId);
  let filteredChats;

  if (searchTerm.trim() === "") {
    filteredChats = chats.filter((chat) => chat.lastMessage != "");
  } else {
    filteredChats = chats.filter((chat) =>
      chat.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="space-y-1 px-2 pt-2 overflow-y-auto h-full">
      {filteredChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={chat.username === currentChat}
          isOnline={onlineUserIds.includes(String(chat.id))}
          onClick={() => onSelect(chat)}
        />
      ))}

      {filteredChats.length === 0 && (
        <p className="text-muted text-center py-4 text-sm">no chats found</p>
      )}
    </div>
  );
}
