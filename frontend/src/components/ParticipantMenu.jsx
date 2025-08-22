import { UserPlus, Shield, UserMinus } from "lucide-react";

export default function ParticipantMenu({
  canPromote,
  canDemote,
  canRemove,
  onPromote,
  onDemote,
  onRemove,
  openUpwards,
}) {
  return (
    <ul
      role="menu"
      tabIndex={-1}
      onMouseDown={(e) => e.stopPropagation()}
      className={`absolute z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-xl text-sm overflow-hidden
        ${openUpwards ? "bottom-full mb-1" : "top-full mt-1"} right-0`}
    >
      {canPromote && (
        <li
          role="menuitem"
          onClick={onPromote}
          className="flex items-center gap-2 px-4 py-2 text-black hover:bg-blue-50 cursor-pointer"
        >
          <UserPlus size={16} />
          make admin
        </li>
      )}
      {canDemote && (
        <li
          role="menuitem"
          onClick={onDemote}
          className="flex items-center gap-2 px-4 py-2 text-black hover:bg-blue-50 cursor-pointer"
        >
          <Shield size={16} />
          remove admin
        </li>
      )}
      {canRemove && (
        <li
          role="menuitem"
          onClick={onRemove}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <UserMinus size={16} />
          remove
        </li>
      )}
    </ul>
  );
}
