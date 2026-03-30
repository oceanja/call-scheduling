import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../api/auth";

export default function UserProfileForm() {
  const { user, refreshUser } = useAuth();
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "USER") return;
    setTags((user.tags || []).join(", "));
    setDescription(user.description || "");
  }, [user]);

  if (!user || user.role !== "USER") return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await authApi.updateProfile({ tags: tagList, description: description.trim() || null });
      await refreshUser();
      setMsg("Saved.");
    } catch (err) {
      setMsg(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Your profile</h2>
      <p className="text-slate-400 text-sm mb-4">
        Tags and description help admins match you with mentors.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 text-white px-3 py-2 text-sm"
            placeholder="e.g. Tech, Good communication"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 text-white px-3 py-2 text-sm"
            placeholder="Goals, background, what you want from mentoring..."
          />
        </div>
        {msg && <p className="text-sm text-slate-400">{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
