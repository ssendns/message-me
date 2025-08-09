import { useState } from "react";

export default function useUploadImage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uploadImage = async (file) => {
    if (!file) return null;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "upload failed");
      }
      const data = await res.json();
      return data || null;
    } catch (err) {
      setError(err.message || "upload error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading, error };
}
