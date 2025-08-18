import Avatar from "../Avatar";

export default function GroupInfoDrawer({
  open,
  chat,
  membersCount,
  currentUserId,
  onEdit,
}) {
  const isCurrent = (p) => String(p?.id) === String(currentUserId);
  return (
    <aside
      className={`fixed top-0 right-0 h-full w-[320px] bg-white shadow-lg z-40 
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-3 border-b flex items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg text-primary font-semibold">{chat.title}</h1>
          <span className="text-xs text-gray-500">
            {membersCount} {membersCount === 1 ? "member" : "members"}
          </span>
        </div>
        <button
          onClick={onEdit}
          className="text-sm p-2 text-primary self-center hover:underline"
        >
          edit
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
            <span
              className={`${
                isCurrent(p) ? "text-primary font-medium" : "text-gray-800"
              }`}
            >
              {p.username}
            </span>
            {isCurrent(p) && (
              <span className="text-gray-400 text-xs">(you)</span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
