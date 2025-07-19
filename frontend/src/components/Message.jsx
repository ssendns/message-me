export default function Message({ message, currentUserId }) {
  const isOwn = message.fromId === currentUserId;

  const time =
    message.createdAt &&
    new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`relative px-4 py-2 max-w-xs break-words rounded-xl ${
          isOwn
            ? "bg-primary text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        }`}
      >
        <div className="pr-7">{message.content}</div>
        {time && (
          <span
            className={`absolute bottom-1 right-2 text-[10px] ${
              isOwn ? "text-white/70" : "text-gray-500"
            }`}
          >
            {time}
          </span>
        )}
      </div>
    </div>
  );
}
