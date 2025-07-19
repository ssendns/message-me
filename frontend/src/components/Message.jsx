export default function Message({ message, currentUserId }) {
  const isOwn = message.fromId === currentUserId;

  return (
    <div
      className={`text-sm my-2 ${
        isOwn ? "text-right text-primary" : "text-left"
      }`}
    >
      <span>{message.content}</span>
    </div>
  );
}
