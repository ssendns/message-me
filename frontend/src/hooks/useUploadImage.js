import { useEffect, useRef, useState } from "react";
import { upload } from "../services/api";

const DEFAULTS = {
  maxSizeMB: 10,
  acceptTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  timeoutMs: 30_000,
};

export default function useUploadImage({
  maxSizeMB = DEFAULTS.maxSizeMB,
  acceptTypes = DEFAULTS.acceptTypes,
  timeoutMs = DEFAULTS.timeoutMs,
} = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const clearError = () => setError("");

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const validate = (file) => {
    if (!file) throw new Error("no file selected");
    if (!acceptTypes.includes(file.type)) {
      throw new Error("unsupported file type");
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`file is too large (>${maxSizeMB}MB)`);
    }
  };

  const uploadImage = async (file) => {
    try {
      validate(file);
    } catch (err) {
      setError(err.message);
      return null;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
    try {
      return await upload(file);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          err.message === "timeout" ? "upload timeout" : "upload aborted"
        );
      } else {
        setError(err.message || "upload error");
      }
      return null;
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  return { uploadImage, loading, error, clearError };
}
