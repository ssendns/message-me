export default function AvatarBubble({ username, isOnline }) {
  const initial = username?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative">
      <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold">
        {initial}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
}
