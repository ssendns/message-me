import { useRef, useState, useCallback } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import useUploadImage from "../hooks/useUploadImage";
import { setChatAvatar, removeChatAvatar } from "../services/api";
import Avatar from "./Avatar";

export default function ChatAvatarPicker({
  chatId,
  token,
  title = "group",
  initialUrl = null,
  onChanged,
}) {
  const fileRef = useRef(null);
  const { uploadImage, loading } = useUploadImage();
  const [localUrl, setLocalUrl] = useState(initialUrl);
  const [saving, setSaving] = useState(false);

  const busy = loading || saving;

  const pick = () => fileRef.current?.click();

  const onFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !token || !chatId) return;

      const prev = localUrl;
      setSaving(true);
      try {
        const up = await uploadImage(file);
        if (!up?.url || !up?.publicId) throw new Error("upload failed");

        setLocalUrl(up.url);

        await setChatAvatar({
          chatId,
          token,
          imageUrl: up.url,
          imagePublicId: up.publicId,
        });

        onChanged?.(up.url);
      } catch (err) {
        console.error("chat avatar update failed:", err);
        setLocalUrl(prev);
        alert(err.message || "failed to update chat avatar");
      } finally {
        setSaving(false);
      }
    },
    [chatId, token, uploadImage, localUrl, onChanged]
  );

  const remove = useCallback(async () => {
    if (!token || !chatId) return;

    const prev = localUrl;
    setSaving(true);
    try {
      setLocalUrl(null);
      await removeChatAvatar({ chatId, token });
      onChanged?.(null);
    } catch (err) {
      console.error("chat avatar delete failed:", err);
      setLocalUrl(prev);
      alert(err.message || "failed to remove chat avatar");
    } finally {
      setSaving(false);
    }
  }, [chatId, token, localUrl, onChanged]);

  return (
    <div className="flex items-center gap-4">
      <Avatar avatarUrl={localUrl} username={title} size={72} />

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
          aria-label={localUrl ? "change group avatar" : "upload group avatar"}
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
            aria-label="remove group avatar"
          >
            <X size={16} />
            remove
          </button>
        )}
      </div>
    </div>
  );
}
