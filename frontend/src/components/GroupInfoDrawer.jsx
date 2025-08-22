import { useState } from "react";
import {
  addParticipantToChat,
  removeParticipantFromChat,
  promoteToAdmin,
  demoteFromAdmin,
} from "../services/api";
import ParticipantItem from "./ParticipantItem";

const canEditGroup = (r) => r === "OWNER" || r === "ADMIN";
const isOwner = (r) => r === "OWNER";
const isAdmin = (r) => r === "ADMIN";

export default function GroupInfoDrawer({
  open,
  chat,
  membersCount,
  currentUserId,
  currentUserRole = "MEMBER",
  onEdit,
}) {
  const token = localStorage.getItem("token");
  const [localParticipants, setLocalParticipants] = useState(
    chat.participants || []
  );

  const refreshRole = (userId, role) => {
    setLocalParticipants((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, role } : p))
    );
  };
  const removeLocal = (userId) => {
    setLocalParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  const handlePromote = async (userId) => {
    await promoteToAdmin({ chatId: chat.id, userId, token });
    refreshRole(userId, "ADMIN");
  };
  const handleDemote = async (userId) => {
    await demoteFromAdmin({ chatId: chat.id, userId, token });
    refreshRole(userId, "MEMBER");
  };
  const handleRemove = async (userId) => {
    await removeParticipantFromChat({ chatId: chat.id, userId, token });
    removeLocal(userId);
  };

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-[330px] bg-white shadow-lg z-40 
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-3 border-b flex items-start justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg text-primary font-semibold">{chat.title}</h1>
          <span className="text-xs text-gray-500">
            {membersCount ?? localParticipants.length}{" "}
            {(membersCount ?? localParticipants.length) === 1
              ? "member"
              : "members"}
          </span>
        </div>
        {canEditGroup(currentUserRole) && (
          <button
            onClick={onEdit}
            className="text-xs text-primary hover:underline"
            title="edit group"
          >
            edit
          </button>
        )}
      </div>

      <div className="p-4">
        {localParticipants.map((p) => {
          const isCurrent = p.id === currentUserId;

          const allowPromote =
            currentUserRole === "OWNER" &&
            p.role !== "OWNER" &&
            p.role !== "ADMIN";
          const allowDemote = currentUserRole === "OWNER" && p.role === "ADMIN";
          const allowRemove =
            p.role !== "OWNER" &&
            (currentUserRole === "OWNER" ||
              (currentUserRole === "ADMIN" && p.role !== "ADMIN"));

          return (
            <ParticipantItem
              key={p.id}
              p={p}
              isCurrent={isCurrent}
              canPromote={allowPromote}
              canDemote={allowDemote}
              canRemove={allowRemove}
              onPromote={handlePromote}
              onDemote={handleDemote}
              onRemove={handleRemove}
            />
          );
        })}
      </div>
    </aside>
  );
}
