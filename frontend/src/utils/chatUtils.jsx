import { systemPreview } from "./systemMessageClient";

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return "today";
  if (isSameDay(date, yesterday)) return "yesterday";

  return date.toLocaleDateString();
}

export function UnreadDivider() {
  return (
    <div className="my-3 flex items-center gap-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-500 whitespace-nowrap">unread</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function DateLabel({ date }) {
  return (
    <div className="text-center text-xs text-muted my-2 uppercase tracking-wide">
      {date}
    </div>
  );
}

export const sortByTimeDesc = (list) =>
  [...list].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

const safeUpper = (v) => String(v || "").toUpperCase();

export function mapApiChat(chat, currentUserId) {
  const last = chat.lastMessage || null;
  const others = chat.participants.filter(
    (p) => String(p.id) !== String(currentUserId)
  );

  const isGroup = safeUpper(chat?.type) === "GROUP";
  const fallbackName = others.map((p) => p.username).join(", ");
  const displayName = isGroup
    ? (chat.title && chat.title.trim()) || fallbackName
    : fallbackName;
  const currentUserRole =
    chat.participants.find((p) => p.id === currentUserId)?.role ?? "MEMBER";

  const isSystem = last?.type === "SYSTEM";
  const lastMessageText = isSystem
    ? systemPreview(last, chat.participants, currentUserId)
    : last?.text ?? "";

  const lastMessageImageUrl = isSystem ? null : last?.imageUrl ?? null;

  return {
    id: chat.id,
    type: chat.type,
    isGroup,
    currentUserRole,
    membersCount: chat.participants.length,
    participants: chat.participants,
    displayName,
    avatarUrl: chat.avatarUrl ?? null,
    lastMessageText,
    lastMessageImageUrl,
    lastMessageId: last?.id ?? null,
    time: last?.createdAt ?? null,
    unreadCount: chat.unreadCount ?? 0,
    hasUnread: (chat.unreadCount ?? 0) > 0,
  };
}
