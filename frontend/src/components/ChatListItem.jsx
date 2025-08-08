import AvatarBubble from "./AvatarBubble";
import { Image as ImageIcon } from "lucide-react";

export default function ChatListItem({ chat, isActive, isOnline, onClick }) {
  const { username, lastMessageContent, lastMessageImageUrl, time } = chat;
  const formattedTime = time
    ? (() => {
        const messageDate = new Date(time);
        const now = new Date();

        const isToday =
          messageDate.getDate() === now.getDate() &&
          messageDate.getMonth() === now.getMonth() &&
          messageDate.getFullYear() === now.getFullYear();

        return isToday
          ? messageDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : messageDate.toLocaleDateString([], {
              day: "2-digit",
              month: "2-digit",
            });
      })()
    : "";

  const preview = lastMessageContent?.trim()
    ? lastMessageContent
    : lastMessageImageUrl
    ? "[image]"
    : "";

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
              className={`text-sm max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis ${
                isActive ? "text-white/90" : "text-gray-500"
              }`}
            >
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
                {preview || " "}
              </div>
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

            {chat.hasUnread && (
              <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
