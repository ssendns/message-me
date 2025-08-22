import { Pencil, Trash2, Copy } from "lucide-react";

export default function MessageMenu({
  isOwn,
  openUpwards,
  onEdit,
  onDelete,
  onCopy,
}) {
  return (
    <ul
      role="menu"
      tabIndex={-1}
      className={`absolute z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-xl text-sm overflow-hidden animate-fade-in
        ${openUpwards ? "bottom-full mb-1" : "top-full mt-1"} 
        ${isOwn ? "right-0" : "left-0"}`}
    >
      {isOwn && (
        <>
          <li
            role="menuitem"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-blue-100 cursor-pointer"
          >
            <Pencil size={16} />
            edit
          </li>
          <li
            role="menuitem"
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-red-100 cursor-pointer"
          >
            <Trash2 size={16} />
            delete
          </li>
        </>
      )}
      <li
        role="menuitem"
        onClick={onCopy}
        className="flex items-center gap-2 px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
      >
        <Copy size={16} />
        copy
      </li>
    </ul>
  );
}
