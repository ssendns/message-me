import useChatList from "../hooks/useChatList";
import ChatListItem from "./ChatListItem";

export default function ChatList({
  token,
  currentUserId,
  currentChat,
  onSelect,
  searchTerm,
}) {
  const { chats, onlineUserIds } = useChatList(
    token,
    currentUserId,
    currentChat
  );
  const search = searchTerm.toLowerCase();
  const filteredChats =
    search.trim() === ""
      ? chats.filter((chat) => chat.lastMessage !== "")
      : chats.filter((chat) => chat.username.toLowerCase().includes(search));

  return (
    <div className="space-y-1 px-2 pt-2 overflow-y-auto h-full">
      {filteredChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === currentChat?.id}
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
