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

function normalizeParticipant(p) {
  if (!p) return null;
  const src = p.user ?? p; // если есть p.user — берём его, иначе сам p
  return {
    id: src.id,
    username: src.username,
    avatarUrl: src.avatarUrl ?? null,
  };
}

export function mapApiChat(chat, currentUserId) {
  const last = chat?.lastMessage ?? null;

  // Надёжно разворачиваем участников
  const rawParticipants = Array.isArray(chat?.participants)
    ? chat.participants
    : [];

  const participants = rawParticipants
    .map(normalizeParticipant)
    .filter(Boolean);

  const others = participants.filter(
    (p) => String(p.id) !== String(currentUserId)
  );

  const isGroup = safeUpper(chat?.type) === "GROUP";
  const fallbackName = others.map((p) => p.username).join(", ");
  const displayName = isGroup
    ? (chat?.title && chat.title.trim()) || fallbackName
    : fallbackName;

  return {
    id: chat?.id,
    type: chat?.type,
    isGroup,
    membersCount: participants.length,
    participants, // <-- теперь у каждого будет {id, username, avatarUrl}
    displayName,
    avatarUrl: chat?.avatarUrl ?? null, // аватар группы (если есть)
    lastMessageText: last?.text ?? "",
    lastMessageImageUrl: last?.imageUrl ?? "",
    lastMessageId: last?.id ?? null,
    time: last?.createdAt ?? chat?.updatedAt ?? null,
    unreadCount: chat?.unreadCount ?? 0,
    hasUnread: (chat?.unreadCount ?? 0) > 0,
  };
}
