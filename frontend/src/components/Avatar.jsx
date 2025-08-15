export default function Avatar({ src, name, size = 40 }) {
  const fallback = (name || "?").slice(0, 1).toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name || "avatar"}
      style={{ width: size, height: size }}
      className="rounded-full object-cover"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold"
      aria-label="avatar fallback"
    >
      {fallback}
    </div>
  );
}
