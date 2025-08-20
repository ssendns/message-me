import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import useUploadImage from "../hooks/useUploadImage";
import Avatar from "./Avatar";

export default function AvatarPicker({
  initialUrl = null,
  onChange,
  label = "avatar",
}) {
  const fileRef = useRef(null);
  const { uploadImage, loading } = useUploadImage();
  const [localUrl, setLocalUrl] = useState(initialUrl);

  useEffect(() => setLocalUrl(initialUrl || null), [initialUrl]);

  const pick = () => fileRef.current?.click();

  const onFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      const up = await uploadImage(file);
      if (!up?.url || !up?.publicId) {
        alert("upload failed");
        return;
      }
      setLocalUrl(up.url);
      onChange?.({ url: up.url, publicId: up.publicId });
    },
    [uploadImage, onChange]
  );

  const remove = useCallback(() => {
    setLocalUrl(null);
    onChange?.(null);
  }, [onChange]);

  return (
    <div className="flex items-center gap-4">
      <Avatar avatarUrl={localUrl} username={label} size={72} />

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />

        <button
          type="button"
          onClick={pick}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
          aria-label={localUrl ? "change avatar" : "upload avatar"}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Camera size={16} />
          )}
          {localUrl ? "change" : "upload"}
        </button>

        {localUrl && (
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-red-600 active:scale-[0.98] transition disabled:opacity-50"
            aria-label="remove avatar"
          >
            <X size={16} />
            remove
          </button>
        )}
      </div>
    </div>
  );
}
