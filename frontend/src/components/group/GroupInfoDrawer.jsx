import { useState, useEffect, useMemo } from "react";
import {
  removeParticipantFromChat,
  promoteToAdmin,
  demoteFromAdmin,
  leaveGroup,
  deleteGroup,
} from "../../services/api";
import ParticipantItem from "./ParticipantItem";

const canEditGroup = (r) => r === "OWNER" || r === "ADMIN";

export default function GroupInfoDrawer({
  open,
  chat,
  membersCount,
  currentUserId,
  currentUserRole = "MEMBER",
  onEdit,
  onAfterLeave,
  onAfterDelete,
}) {
  const token = localStorage.getItem("token");
  const [localParticipants, setLocalParticipants] = useState(
    chat.participants || []
  );
  useEffect(() => {
    setLocalParticipants(chat.participants || []);
  }, [chat.participants]);

  const [pendingMap, setPendingMap] = useState({});
  const setPending = (userId, v) =>
    setPendingMap((m) => ({ ...m, [userId]: v }));

  const memberCount = useMemo(
    () => (Array.isArray(localParticipants) ? localParticipants.length : 0),
    [localParticipants]
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
    const prev = localParticipants.find((p) => p.id === userId)?.role;
    refreshRole(userId, "ADMIN");
    setPending(userId, true);
    try {
      await promoteToAdmin({ chatId: chat.id, userId, token });
    } catch (err) {
      if (prev) refreshRole(userId, prev);
      alert(err.message || "failed to promote");
    } finally {
      setPending(userId, false);
    }
  };

  const handleDemote = async (userId) => {
    const prev = localParticipants.find((p) => p.id === userId)?.role;
    refreshRole(userId, "MEMBER");
    setPending(userId, true);
    try {
      await demoteFromAdmin({ chatId: chat.id, userId, token });
    } catch (err) {
      if (prev) refreshRole(userId, prev);
      alert(err.message || "failed to demote");
    } finally {
      setPending(userId, false);
    }
  };

  const handleRemove = async (userId) => {
    const prev = localParticipants;
    removeLocal(userId);
    setPending(userId, true);
    try {
      await removeParticipantFromChat({ chatId: chat.id, userId, token });
    } catch (err) {
      setLocalParticipants(prev);
      alert(err.message || "failed to remove member");
    } finally {
      setPending(userId, false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup({ chatId: chat.id, token });
      if (onAfterDelete) onAfterDelete();
      else window.location.href = "/";
    } catch (err) {
      alert(err.message || "failed to delete chat");
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup({ chatId: chat.id, token });
      if (onAfterLeave) onAfterLeave();
      else window.location.href = "/";
    } catch (err) {
      alert(err.message || "failed to leave chat");
    }
  };

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-[330px] bg-white shadow-lg z-40 
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
    >
      <div className="p-3 border-b flex items-center justify-between">
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
              disabled={!!pendingMap[p.id]}
            />
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t">
        {currentUserRole === "OWNER" ? (
          <button
            onClick={handleDelete}
            className="w-full py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            delete chat
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            leave chat
          </button>
        )}
      </div>
    </aside>
  );
}
