import { useMemo, useState } from "react";
import Avatar from "./Avatar";

/**
 * Универсальный список выбора пользователей с поиском.
 *
 * props:
 * - users: [{ id, username, avatarUrl }]
 * - selected: Set<number> — выбранные id
 * - onToggle: (id:number) => void
 * - excludeIds?: Iterable<number> — кого скрыть (например, уже участники + ты)
 * - placeholder?: string
 * - maxHeight?: string (tailwind class)
 */
export default function UserSelectList({
  users = [],
  selected,
  onToggle,
  excludeIds,
  placeholder = "search users…",
  maxHeight = "max-h-56",
}) {
  const [query, setQuery] = useState("");
  const exclude = useMemo(() => new Set(excludeIds || []), [excludeIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => !exclude.has(Number(u.id)))
      .filter((u) =>
        q
          ? String(u.username || "")
              .toLowerCase()
              .includes(q)
          : true
      );
  }, [users, exclude, query]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <div className={`${maxHeight} overflow-y-auto rounded-lg border`}>
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted text-center">no users</div>
        ) : (
          filtered.map((u) => {
            const id = Number(u.id);
            const checked = selected.has(id);
            return (
              <label
                key={id}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                  checked ? "bg-gray-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(id)}
                  className="accent-primary"
                />
                <Avatar
                  avatarUrl={u.avatarUrl || null}
                  username={u.username}
                  size={28}
                />
                <span className="text-sm">{u.username}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
