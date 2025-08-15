import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateUser, getUser } from "../services/api";
import AvatarPicker from "../components/AvatarPicker";

export default function EditAccountPage() {
  const token = localStorage.getItem("token");
  const initialUsername = localStorage.getItem("username");
  const navigate = useNavigate();

  const [username, setUsername] = useState(initialUsername || "user");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const initialUsernameRef = useRef("");
  initialUsernameRef.current = initialUsername;
  const initialAvatarRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setLoadingProfile(false);
        return;
      }
      try {
        const userInfo = await getUser({ token });
        if (cancelled) return;
        const avatar = userInfo?.user.avatarUrl || "";
        initialAvatarRef.current = avatar;
        setAvatarUrl(avatar);
        if (avatar) localStorage.setItem("avatarUrl", avatar);
        else localStorage.removeItem("avatarUrl");
      } catch (e) {
        console.error("getUser failed:", e);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const hasChanges = useMemo(() => {
    const nameChanged = username.trim() !== initialUsernameRef.current;
    const passChanged = password.trim().length > 0;
    const avatarChanged =
      (avatarUrl || "") !== (initialAvatarRef.current || "");
    return nameChanged || passChanged || avatarChanged;
  }, [username, password, avatarUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("not authenticated");
      return;
    }
    if (!hasChanges) {
      alert("nothing to update");
      return;
    }

    setSaving(true);
    try {
      const payload = {};

      if (username.trim() !== initialUsernameRef.current) {
        payload.newUsername = username.trim();
      }
      if (password.trim()) {
        payload.newPassword = password.trim();
      }
      if ((avatarUrl || "") !== (initialAvatarRef.current || "")) {
        payload.avatarUrl = avatarUrl?.trim() ?? "";
      }

      const resp = await updateUser({ ...payload, token });
      const updated = resp?.user || {};

      if (typeof updated.username === "string") {
        initialUsernameRef.current = updated.username;
        setUsername(updated.username);
        localStorage.setItem("username", updated.username);
      }
      if ("avatarUrl" in updated) {
        initialAvatarRef.current = updated.avatarUrl || "";
        setAvatarUrl(updated.avatarUrl || "");
        if (updated.avatarUrl) {
          localStorage.setItem("avatarUrl", updated.avatarUrl);
        } else {
          localStorage.removeItem("avatarUrl");
        }
      }

      alert("account updated successfully");
      navigate("/");
    } catch (err) {
      console.error("update failed:", err);
      alert(err.message || "error updating account.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <main className="min-h-screen grid place-items-center text-muted">
        loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins p-layout max-w-screen mx-auto">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-primary">edit account</h1>

        <AvatarPicker
          username={username}
          initialUrl={avatarUrl}
          token={token}
          onChanged={(url) => setAvatarUrl(url ?? "")}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">username</label>
            <input
              type="text"
              className="w-full border border-muted rounded px-4 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">new password</label>
            <input
              type="password"
              className="w-full border border-muted rounded px-4 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="leave blank to keep current"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? "saving..." : "save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
