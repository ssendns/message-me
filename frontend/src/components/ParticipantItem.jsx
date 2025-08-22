import Avatar from "./Avatar";
import { MoreVertical, Shield, Crown } from "lucide-react";
import useParticipantMenu from "../hooks/useParticipantMenu";
import ParticipantMenu from "./ParticipantMenu";

const isOwner = (r) => r === "OWNER";
const isAdmin = (r) => r === "ADMIN";

export default function ParticipantItem({
  p,
  isCurrent,
  canPromote,
  canDemote,
  canRemove,
  onPromote,
  onDemote,
  onRemove,
}) {
  const { rowRef, open, openUpwards, toggleMenu, closeMenu } =
    useParticipantMenu();

  return (
    <div
      ref={rowRef}
      className="relative flex items-center justify-between py-2"
    >
      <div className="flex items-center gap-3">
        <Avatar avatarUrl={p.avatarUrl} username={p.username} size={36} />
        <div className="flex items-center gap-2">
          <span className={`${isCurrent ? "text-primary font-medium" : ""}`}>
            {p.username}{" "}
            {isCurrent && (
              <span className="text-gray-400 text-xs align-middle">(you)</span>
            )}
          </span>

          {isOwner(p.role) && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
              <Crown size={10} />
              owner
            </span>
          )}
          {isAdmin(p.role) && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              <Shield size={10} />
              admin
            </span>
          )}
        </div>
      </div>

      {(canPromote || canDemote || canRemove) && (
        <div className="relative">
          <button
            type="button"
            onClick={toggleMenu}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-gray-100"
            aria-haspopup="menu"
            aria-expanded={open ? "true" : "false"}
            title="actions"
          >
            <MoreVertical size={16} />
          </button>

          {open && (
            <ParticipantMenu
              canPromote={canPromote}
              canDemote={canDemote}
              canRemove={canRemove}
              onPromote={() => {
                onPromote?.(p.id);
                closeMenu();
              }}
              onDemote={() => {
                onDemote?.(p.id);
                closeMenu();
              }}
              onRemove={() => {
                onRemove?.(p.id);
                closeMenu();
              }}
              openUpwards={openUpwards}
            />
          )}
        </div>
      )}
    </div>
  );
}
