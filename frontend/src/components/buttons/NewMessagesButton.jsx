import { ChevronDown } from "lucide-react";

export default function NewMessagesButton({ count, onClick }) {
  if (count <= 0) return null;
  return (
    <button
      onClick={onClick}
      className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-2 rounded-full shadow-lg px-4 py-2 bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 active:scale-95 transition"
    >
      <ChevronDown size={18} />
      <span>
        {count} new message{count > 1 ? "s" : ""}
      </span>
    </button>
  );
}
