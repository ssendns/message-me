import { useState, useMemo } from "react";

export default function Avatar({
  avatarUrl,
  username,
  size = 40,
  isOnline = null,
}) {
  const [imgOk, setImgOk] = useState(true);

  const fallback = useMemo(() => {
    const ch = (username || "").trim().charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }, [username]);

  const showImage = Boolean(avatarUrl && imgOk);

  return (
    <div
      className="relative inline-block rounded-full border-2 border-gray-150"
      style={{ width: size, height: size }}
      aria-label="avatar"
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={username || "avatar"}
          width={size}
          height={size}
          className="w-full h-full rounded-full object-cover block"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold select-none">
          {fallback}
        </div>
      )}

      {isOnline === true && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow" />
      )}
    </div>
  );
}
