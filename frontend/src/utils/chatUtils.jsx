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
