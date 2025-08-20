import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, editUser, getChat, editGroup } from "../services/api";
import AvatarPicker from "../components/AvatarPicker";

export default function EditPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { chatId } = useParams();
  const isGroupMode = Boolean(chatId);

  const [name, setName] = useState("");

  // user only
  const [password, setPassword] = useState("");

  // group mode only
  const [initialAvatar, setInitialAvatar] = useState(null);
  const [avatarDraft, setAvatarDraft] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const initialNameRef = useRef("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!token) return;

        if (isGroupMode) {
          const res = await getChat({ token, chatId });
          const chat = res?.chat;
          if (!chat) throw new Error("chat not found");

          const title = chat.title || "";
          const avatarUrl = chat.avatarUrl || null;
          const avatarPublicId = chat.avatarPublicId || null;

          initialNameRef.current = title;
          setName(title);

          const init = avatarUrl
            ? { url: avatarUrl, publicId: avatarPublicId }
            : null;
          setInitialAvatar(init);
          setAvatarDraft(init);
        } else {
          const res = await getCurrentUser({ token });
          const user = res?.user;
          if (!user) throw new Error("user not found");

          const username = user.username || "user";
          const avatarUrl = user.avatarUrl || null;
          const avatarPublicId = user.avatarPublicId || null;

          initialNameRef.current = username;
          setName(username);

          const init = avatarUrl
            ? { url: avatarUrl, publicId: avatarPublicId }
            : null;
          setInitialAvatar(init);
          setAvatarDraft(init);

          localStorage.setItem("username", username);
          if (avatarUrl) localStorage.setItem("avatarUrl", avatarUrl);
          else localStorage.removeItem("avatarUrl");
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token, isGroupMode, chatId]);

  const hasChanges = useMemo(() => {
    const nameChanged = name.trim() !== initialNameRef.current;
    const passwordChanged = !isGroupMode && password.trim().length > 0;
    const avatarChanged =
      JSON.stringify(avatarDraft ?? null) !==
      JSON.stringify(initialAvatar ?? null);

    return nameChanged || passwordChanged || avatarChanged;
  }, [name, password, avatarDraft, initialAvatar, isGroupMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!hasChanges) {
      alert("nothing to update");
      return;
    }
    setSaving(true);
    try {
      if (isGroupMode) {
        const body = {};
        if (name.trim() !== initialNameRef.current) body.newTitle = name.trim();
        if (JSON.stringify(avatarDraft) !== JSON.stringify(initialAvatar)) {
          body.avatarUrl = avatarDraft?.url ?? null;
          body.avatarPublicId = avatarDraft?.publicId ?? null;
        }

        const res = await editGroup({ token, chatId, ...body });
        const updated = res?.chat;
        if (updated?.title != null) initialNameRef.current = updated.title;

        setInitialAvatar(
          updated?.avatarUrl
            ? {
                url: updated.avatarUrl,
                publicId: updated.avatarPublicId ?? null,
              }
            : null
        );

        alert("group updated");
        navigate("/");
      } else {
        const body = {};
        if (name.trim() !== initialNameRef.current)
          body.newUsername = name.trim();
        if (password.trim()) body.newPassword = password.trim();

        if (JSON.stringify(avatarDraft) !== JSON.stringify(initialAvatar)) {
          body.avatarUrl = avatarDraft?.url ?? null;
          body.avatarPublicId = avatarDraft?.publicId ?? null;
        }

        const res = await editUser({ ...body, token });
        const user = res?.user;

        if (user.username) {
          initialNameRef.current = user.username;
          localStorage.setItem("username", user.username);
        }
        if (user.avatarUrl) localStorage.setItem("avatarUrl", user.avatarUrl);
        else localStorage.removeItem("avatarUrl");

        setInitialAvatar(
          user.avatarUrl
            ? { url: user.avatarUrl, publicId: user.avatarPublicId ?? null }
            : null
        );

        alert("account updated");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted">
        loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins p-layout max-w-screen mx-auto">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-primary">
          {isGroupMode ? "edit group" : "edit account"}
        </h1>

        <AvatarPicker
          initialUrl={avatarDraft?.url ?? null}
          onChange={(val) => setAvatarDraft(val)}
          label={name}
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">
              {isGroupMode ? "group title" : "username"}
            </label>
            <input
              type="text"
              className="w-full border border-muted rounded px-4 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isGroupMode ? "enter group title" : "enter username"}
            />
          </div>

          {!isGroupMode && (
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
          )}

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
