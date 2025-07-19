import { Pencil, Trash2, Copy } from "lucide-react";

export default function MessageMenu({
  isOwn,
  shouldOpenUpwards,
  onEdit,
  onDelete,
  onCopy,
}) {
  return (
    <ul
      className={`absolute z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-xl text-sm overflow-hidden animate-fade-in
        ${shouldOpenUpwards ? "bottom-full mb-1" : "top-full mt-1"} 
        ${isOwn ? "right-0" : "left-0"}`}
    >
      {isOwn && (
        <>
          <li
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-blue-100 cursor-pointer"
          >
            <Pencil size={16} />
            edit
          </li>
          <li
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 text-black hover:bg-red-100 cursor-pointer"
          >
            <Trash2 size={16} />
            delete
          </li>
        </>
      )}
      <li
        className="flex items-center gap-2 px-4 py-2 text-black hover:bg-gray-100 cursor-pointer"
        onClick={onCopy}
      >
        <Copy size={16} />
        copy
      </li>
    </ul>
  );
}
