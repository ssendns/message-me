import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getAllUsers, createGroup, editGroup } from "../services/api";
import AvatarPicker from "../components/avatar/AvatarPicker";
import UserSelectList from "../components/group/UserSelectList";

export default function CreateGroupPage() {
  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("id"));
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [avatarDraft, setAvatarDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!token) return;
        const list = await getAllUsers(token);
        if (cancel) return;
        const arr = Array.isArray(list) ? list : list?.users || [];
        setUsers(arr.filter((user) => Number(user.id) !== currentUserId));
      } catch (err) {
        console.error("load users failed:", err);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token, currentUserId]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canCreate = title.trim().length > 0 && selected.size >= 1;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!token || !canCreate) return;

    setCreating(true);
    try {
      const res = await createGroup({
        token,
        title: title.trim(),
        participantIds: Array.from(selected),
      });
      const chatId = res?.id ?? res?.chat?.id;
      if (!chatId) throw new Error("failed to create group");

      if (avatarDraft?.url || avatarDraft === null) {
        await editGroup({
          token,
          chatId,
          avatarUrl: avatarDraft?.url ?? null,
          avatarPublicId: avatarDraft?.publicId ?? null,
        });
      }

      navigate("/");
    } catch (err) {
      console.error("create group failed:", err);
      alert(err.message || "failed to create group");
    } finally {
      setCreating(false);
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
            title="back"
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold text-primary text-center">
            create group
          </h1>
          <span className="text-xs text-transparent justify-self-end">•</span>
        </div>

        <div className="flex justify-center mb-6">
          <AvatarPicker
            initialUrl={avatarDraft?.url ?? null}
            onChange={(val) => setAvatarDraft(val)}
            label={title || "group"}
          />
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm text-muted">
              group title
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="enter group title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
              add participants
            </label>

            <UserSelectList
              users={users}
              selected={selected}
              onToggle={toggle}
              excludeIds={[currentUserId]}
              placeholder="search users…"
            />
          </div>

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
              disabled={!canCreate || creating}
              className="w-28 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-center"
            >
              {creating ? "creating..." : "create"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
