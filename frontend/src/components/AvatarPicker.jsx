import { useRef, useState, useCallback } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import useUploadImage from "../hooks/useUploadImage";
import { updateAvatar, deleteAvatar } from "../services/api";
import Avatar from "./Avatar";

export default function AvatarPicker({
  token,
  username,
  initialUrl = null,
  onChanged,
}) {
  const fileRef = useRef(null);
  const { uploadImage, loading } = useUploadImage();
  const [localUrl, setLocalUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);

  const pick = () => fileRef.current?.click();

  const onFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !token) return;

      setSaving(true);
      let prevUrl = localUrl;

      try {
        const up = await uploadImage(file);
        if (!up?.url || !up?.publicId) throw new Error("upload failed");
        setLocalUrl(up.url);
        await updateAvatar({
          token,
          imageUrl: up.url,
          imagePublicId: up.publicId,
        });

        onChanged?.(up.url);
      } catch (err) {
        console.error("avatar update failed:", err);
        setLocalUrl(prevUrl);
        alert(err.message || "failed to update avatar");
      } finally {
        setSaving(false);
      }
    },
    [token, uploadImage, localUrl, onChanged]
  );

  const remove = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    const prevUrl = localUrl;
    try {
      setLocalUrl(null);
      await deleteAvatar({ token });
      onChanged?.(null);
    } catch (err) {
      console.error("avatar delete failed:", err);
      setLocalUrl(prevUrl);
      alert(err.message || "failed to remove avatar");
    } finally {
      setSaving(false);
    }
  }, [token, localUrl, onChanged]);

  const busy = loading || saving;

  return (
    <div className="flex items-center gap-4">
      <Avatar avatarUrl={localUrl} username={username} size={72} />
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
          disabled={busy}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-50 active:scale-[0.98] transition disabled:opacity-50"
          aria-label={localUrl ? "change avatar" : "upload avatar"}
        >
          {busy ? (
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
            disabled={busy}
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
