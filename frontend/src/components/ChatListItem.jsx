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

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="font-medium text-base">{username}</div>
          {time && (
            <div className="text-xs text-muted mt-0.5">
              {new Date(time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        <div
          className={`text-sm truncate ${
            isActive ? "text-white/90" : "text-gray-500"
          }`}
        >
          {lastMessage}
        </div>
      </div>
    </div>
  );
}
