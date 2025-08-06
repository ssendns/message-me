import AvatarBubble from "./AvatarBubble";

export default function ChatListItem({ chat, isActive, isOnline, onClick }) {
  const { username, lastMessage, time } = chat;

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl px-4 py-3 flex gap-3 transition-all duration-150 ${
        isActive ? "bg-primary text-white" : "hover:bg-gray-100"
      }`}
    >
      <AvatarBubble username={username} isOnline={isOnline} />

      <div className="flex-1 relative">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-base">{username}</div>
            <div
              className={`text-sm truncate ${
                isActive ? "text-white/90" : "text-gray-500"
              }`}
            >
              {lastMessage}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            {time && (
              <div
                className={`text-xs ${
                  isActive ? "text-white/70" : "text-muted"
                }`}
              >
                {new Date(time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}

            {chat.hasUnread && (
              <span className="w-3 h-3 bg-blue-500 rounded-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
