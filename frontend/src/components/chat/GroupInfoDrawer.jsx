import Avatar from "../Avatar";

export default function GroupInfoDrawer({
  open,
  onClose,
  chat,
  membersCount,
  currentUserId,
  onEdit,
}) {
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-[320px] bg-white shadow-lg z-40 
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-3 border-b flex items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{chat.title}</h1>
          <span className="text-xs text-gray-500">
            {membersCount} {membersCount === 1 ? "member" : "members"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        {chat.participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2 py-2">
            <Avatar
              avatarUrl={p.avatarUrl}
              username={p.username}
              size={32}
              isOnline={null}
            />
            <span>{p.username}</span>
            {p.id === currentUserId && (
              <span className="text-gray-400 text-xs">(you)</span>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={onEdit}
          className="w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          edit group
        </button>
      </div>
    </aside>
  );
}
