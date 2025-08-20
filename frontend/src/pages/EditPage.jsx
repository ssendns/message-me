import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getCurrentUser, editUser, getChat, editGroup } from "../services/api";
import AvatarPicker from "../components/AvatarPicker";
import { ArrowLeft } from "lucide-react";
import { buildUserPayload, buildGroupPayload } from "../utils/editUtils";

export default function EditPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { chatId } = useParams();
  const isGroupMode = Boolean(chatId);

  const [name, setName] = useState("");

  const [password, setPassword] = useState(""); // user only
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
        const body = buildGroupPayload({
          name,
          initialName: initialNameRef.current,
          avatarDraft,
          initialAvatar,
        });
        if (!Object.keys(body).length) return alert("nothing to update");
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
        const body = buildUserPayload({
          name,
          password,
          initialName: initialNameRef.current,
          avatarDraft,
          initialAvatar,
        });
        if (!Object.keys(body).length) return alert("nothing to update");

        const res = await editUser({ ...body, token });
        const user = res?.user || {};

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
    <main className="min-h-screen bg-[#fafbfc] text-foreground font-poppins flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-sm px-6 py-8">
        <div className="grid grid-cols-3 items-center mb-6">
          <Link
            to="/"
            className="text-sm text-muted hover:text-primary transition justify-self-start"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold text-primary text-center">
            {isGroupMode ? "edit group" : "edit account"}
          </h1>
          <span
            className={`text-xs justify-self-end ${
              hasChanges ? "text-amber-600" : "text-transparent"
            }`}
          >
            {hasChanges ? "unsaved changes" : "•"}
          </span>
        </div>

        <div className="flex justify-center mb-6">
          <AvatarPicker
            initialUrl={avatarDraft?.url ?? null}
            onChange={(val) => setAvatarDraft(val)}
            label={name}
          />
        </div>

        <div className="h-px bg-gray-100 mb-6" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm text-muted">
              {isGroupMode ? "group title" : "username"}
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isGroupMode ? "enter group title" : "enter username"}
            />
          </div>

          {!isGroupMode && (
            <div>
              <label className="mb-1.5 block text-sm text-muted">
                new password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="leave blank to keep current"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-28 px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 text-center"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="w-28 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-center"
            >
              {saving ? "saving..." : "save"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
