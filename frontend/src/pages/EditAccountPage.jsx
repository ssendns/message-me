import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser, updateUser, getChat, updateChat } from "../services/api";
import AvatarPicker from "../components/AvatarPicker";
import ChatAvatarPicker from "../components/ChatAvatarPicker";

export default function EditAccountPage() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { chatId } = useParams();
  const isGroupMode = Boolean(chatId);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const initialNameRef = useRef("");
  const initialAvatarRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        if (isGroupMode) {
          const chat = await getChat({ token, chatId });
          const c = chat?.chat ?? chat;
          if (!c) throw new Error("chat not found");

          const title = c.title || "";
          const aUrl = c.avatarUrl || "";

          initialNameRef.current = title;
          initialAvatarRef.current = aUrl;

          setName(title);
          setAvatarUrl(aUrl);
        } else {
          const resp = await getUser({ token });
          const u = resp?.user;
          if (!u) throw new Error("user not found");

          const uname = u.username || "user";
          const aUrl = u.avatarUrl || "";

          initialNameRef.current = uname;
          initialAvatarRef.current = aUrl;

          setName(uname);
          setAvatarUrl(aUrl);

          localStorage.setItem("username", uname);
          if (aUrl) localStorage.setItem("avatarUrl", aUrl);
          else localStorage.removeItem("avatarUrl");
        }
      } catch (e) {
        console.error("load failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, isGroupMode, chatId]);

  const hasChanges = useMemo(() => {
    const nameChanged = name.trim() !== initialNameRef.current;
    const passChanged = !isGroupMode && password.trim().length > 0;
    const avatarChanged =
      !isGroupMode && (avatarUrl || "") !== (initialAvatarRef.current || "");
    return nameChanged || passChanged || avatarChanged;
  }, [name, password, avatarUrl, isGroupMode]);

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
    if (isGroupMode && !name.trim()) {
      alert("group title cannot be empty");
      return;
    }

    setSaving(true);
    try {
      if (isGroupMode) {
        const payload = {};
        if (name.trim() !== initialNameRef.current) {
          payload.newTitle = name.trim();
        }
        if (Object.keys(payload).length > 0) {
          const resp = await updateChat({
            token,
            chatId,
            ...payload,
          });
          const updated = resp?.chat ?? resp;
          if (updated?.title != null) {
            initialNameRef.current = updated.title;
            setName(updated.title);
          }
        }
        alert("group updated");
        navigate("/");
      } else {
        const payload = {};
        if (name.trim() !== initialNameRef.current) {
          payload.newUsername = name.trim();
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
          initialNameRef.current = updated.username;
          setName(updated.username);
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
      }
    } catch (err) {
      console.error("update failed:", err);
      alert(err.message || "update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted">
        loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-poppins p-layout max-w-screen mx-auto">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-primary">
          {isGroupMode ? "edit group" : "edit account"}
        </h1>

        {isGroupMode ? (
          <ChatAvatarPicker
            chatId={chatId}
            token={token}
            title={name}
            initialUrl={avatarUrl}
            onChanged={(url) => {
              setAvatarUrl(url ?? "");
              initialAvatarRef.current = url ?? "";
            }}
          />
        ) : (
          <AvatarPicker
            username={name}
            initialUrl={avatarUrl}
            token={token}
            onChanged={(url) => setAvatarUrl(url ?? "")}
          />
        )}

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
