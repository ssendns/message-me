export default function EditInput({ value, onChange, onSave, onCancel }) {
  return (
    <div className="flex gap-2">
      <input
        className="text-sm px-2 py-1 rounded w-full text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
      />
      <button
        onClick={onSave}
        className="text-xs px-2 py-1 bg-primary text-white rounded"
      >
        save
      </button>
    </div>
  );
}
