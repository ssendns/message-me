import Avatar from "../avatar/Avatar";
import { Image as ImageIcon, Loader2 } from "lucide-react";

export default function ChatListItem({
  chat,
  currentUserId,
  isActive,
  isOnline,
  onClick,
  waiting = false,
}) {
  const {
    id,
    isGroup,
    participants = [],
    displayName,
    lastMessageText,
    lastMessageImageUrl,
    time,
    hasUnread,
    unreadCount,
    avatarUrl: groupAvatar,
  } = chat;

  const other = !isGroup
    ? participants.find((p) => String(p.id) !== String(currentUserId)) || null
    : null;

  const name = displayName || (other?.username ?? "chat");
  const avatarUrl = isGroup ? groupAvatar || null : other?.avatarUrl || null;

  const formattedTime = time
    ? (() => {
        const d = new Date(time);
        const now = new Date();
        const isToday =
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear();
        return isToday
          ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
      })()
    : "";

  const preview =
    (lastMessageText && lastMessageText.trim()) ||
    (lastMessageImageUrl ? "[image]" : "");

  return (
    <div
      onClick={waiting ? undefined : onClick}
      className={`cursor-pointer rounded-xl px-4 py-3 flex gap-3 transition-all duration-150 ${
        isActive ? "bg-primary text-white" : "hover:bg-gray-100"
      }`}
    >
      <Avatar
        username={name}
        avatarUrl={avatarUrl}
        isOnline={!isGroup && Boolean(isOnline)}
      />

      <div className="flex-1 relative">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-base flex items-center gap-2">
              {name}
              {waiting && (
                <Loader2 size={14} className="animate-spin opacity-60" />
              )}
            </div>

            <div
              className={`text-sm max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis flex items-center gap-1 ${
                isActive ? "text-white/90" : "text-gray-500"
              }`}
              title={preview}
            >
              {lastMessageImageUrl && (
                <ImageIcon
                  size={14}
                  className={isActive ? "opacity-90" : "opacity-70"}
                />
              )}
              <span className="truncate">{preview || "\u00A0"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            {formattedTime && (
              <div
                className={`text-xs ${
                  isActive ? "text-white/70" : "text-muted"
                }`}
              >
                {formattedTime}
              </div>
            )}
            {hasUnread && unreadCount > 0 && (
              <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
