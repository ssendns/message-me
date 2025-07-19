import { useEffect, useState } from "react";
import { getAllUsers } from "../services/api";

export default function UserList({
  token,
  currentUsername,
  activeUsername,
  onSelect,
}) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!token) return;

    getAllUsers(token).then((data) => setUsers(data));
  }, [token]);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">all users</h2>
      <ul className="space-y-1">
        {users.map((user) => (
          <li
            key={user.id}
            onClick={() => onSelect(user.username)}
            className={`cursor-pointer hover:underline ${
              user.username === activeUsername
                ? "font-bold text-primary"
                : "text-blue-600"
            }`}
          >
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
}
