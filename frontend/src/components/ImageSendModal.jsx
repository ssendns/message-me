import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

export default function ImageSendModal({
  text,
  open,
  filePreview,
  uploading = false,
  onClose,
  onSend,
}) {
  const [caption, setCaption] = useState(text || "");

  useEffect(() => {
    if (open) setCaption(text || "");
  }, [open, text]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-[92vw] max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-medium text-xl">send an image</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-gray-50 border">
            {filePreview ? (
              <img
                src={filePreview}
                alt="preview"
                className="w-full h-auto object-contain max-h-[320px] block"
              />
            ) : (
              <div className="h-[200px] grid place-items-center text-sm text-gray-500">
                no preview
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-5 px-4 py-3 border-t">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="add a caption…"
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => onSend(caption)}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {uploading && <Loader2 className="animate-spin" size={16} />}
              send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
