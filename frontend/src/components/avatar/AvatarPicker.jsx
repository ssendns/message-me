import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import useUploadImage from "../../hooks/useUploadImage";
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
    <div className="w-full flex flex-col items-center text-center">
      <div className="relative mb-3">
        <Avatar avatarUrl={localUrl} username={label} size={128} />
      </div>

      <div className="flex gap-2">
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 text-sm transition disabled:opacity-50"
          aria-label={localUrl ? "change avatar" : "upload avatar"}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Camera size={14} />
          )}
          {localUrl ? "change" : "upload"}
        </button>

        {localUrl && (
          <button
            type="button"
            onClick={remove}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-red-600 text-sm transition disabled:opacity-50"
            aria-label="remove avatar"
          >
            <X size={14} />
            remove
          </button>
        )}
      </div>
    </div>
  );
}
