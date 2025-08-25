import { useAuth } from "../context/AuthContext";

export default function Sidebar({ onLogout, onEdit, onCreate, isOpen }) {
  const { user } = useAuth();
  const username = user?.username;
  return (
    <aside
      className={`bg-white shadow-md p-4 flex flex-col fixed top-0 left-0 h-full z-30 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-[300px]`}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1 text-primary">hello,</h2>
        <p className="text-lg font-bold text-foreground">{username}</p>
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
          log out
        </button>
        <div className="h-px bg-gray-100 my-6" />
        <button
          onClick={onCreate}
          className="w-full text-left px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          create group
        </button>
      </div>
    </aside>
  );
}
