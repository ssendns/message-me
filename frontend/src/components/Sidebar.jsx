import UserList from "./UserList";

export default function Sidebar({
  token,
  activeUsername,
  onSelect,
  onLogout,
  onEdit,
}) {
  return (
    <aside className="w-64 min-h-screen bg-white shadow-md p-4 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1 text-primary">hello,</h2>
        <p className="text-lg font-bold text-foreground">
          {localStorage.getItem("username")}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <button
          onClick={onEdit}
          className="w-full text-left px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          edit account
        </button>
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          logout
        </button>
      </div>

      <UserList
        token={token}
        activeUsername={activeUsername}
        onSelect={onSelect}
      />
    </aside>
  );
}
