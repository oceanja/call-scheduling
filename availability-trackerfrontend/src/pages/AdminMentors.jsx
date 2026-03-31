import { useState, useEffect, useCallback } from "react";
import * as adminApi from "../api/admin";
import AddMentorModal from "../components/AddMentorModal";

function TagBadge({ tag }) {
  return (
    <span className="text-[11px] bg-navy-800 border border-navy-700 text-slate-400 px-1.5 py-0.5 rounded-md">
      {tag}
    </span>
  );
}

function MentorCard({ mentor, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition ${
        isSelected
          ? "border-primary-500/50 bg-primary-600/5"
          : "border-navy-700 bg-navy-900 hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold flex-shrink-0">
            {(mentor.name || mentor.email || "M")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{mentor.name || "—"}</p>
            <p className="text-xs text-slate-500">{mentor.email}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
          MENTOR
        </span>
      </div>

      {mentor.description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2 text-left">{mentor.description}</p>
      )}

      {mentor.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {mentor.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}

      {!mentor.description && (!mentor.tags || mentor.tags.length === 0) && (
        <p className="text-xs text-slate-600 italic text-left">No profile info — click to edit.</p>
      )}

      {isSelected && (
        <p className="text-[11px] text-primary-400 font-medium mt-2 text-left">Click again to collapse editor</p>
      )}
    </button>
  );
}

export default function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  // Inline editor state
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [tagsEdit, setTagsEdit] = useState("");
  const [descEdit, setDescEdit] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadMentors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listMentors();
      setMentors(data);
    } catch (e) {
      setError(e.message || "Failed to load mentors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMentors(); }, [loadMentors]);

  const handleSelectMentor = (mentor) => {
    if (selectedMentor?.id === mentor.id) {
      setSelectedMentor(null);
      return;
    }
    setSelectedMentor(mentor);
    setTagsEdit((mentor.tags || []).join(", "));
    setDescEdit(mentor.description || "");
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.updateMentor(selectedMentor.id, {
        tags: tagsEdit.split(",").map((t) => t.trim()).filter(Boolean),
        description: descEdit.trim() || null,
      });
      setMentors((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
      setSelectedMentor((prev) => prev?.id === updated.id ? { ...prev, ...updated } : prev);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to save mentor");
    } finally {
      setSaving(false);
    }
  };

  const filtered = search.trim()
    ? mentors.filter(
        (m) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.email?.toLowerCase().includes(search.toLowerCase()) ||
          m.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : mentors;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Mentors</h1>
          <p className="text-slate-400 text-sm mt-0.5">{mentors.length} mentors · click a card to edit profile</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Mentor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mentors by name, email or tag…"
          className="w-full h-10 pl-9 pr-4 rounded-lg bg-navy-900 border border-navy-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-5">
        {/* Mentor grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-primary-500 rounded-full animate-spin" />
              Loading mentors…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm">{search ? "No mentors match your search." : "No mentors yet."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((m) => (
                <MentorCard
                  key={m.id}
                  mentor={m}
                  isSelected={selectedMentor?.id === m.id}
                  onClick={() => handleSelectMentor(m)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Inline editor panel */}
        {selectedMentor && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-sm font-bold">
                  {(selectedMentor.name || selectedMentor.email || "M")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selectedMentor.name || "Mentor"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{selectedMentor.email}</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Tags
                    <span className="ml-1 text-slate-600 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsEdit}
                    onChange={(e) => setTagsEdit(e.target.value)}
                    placeholder="Big Tech, Good Communication…"
                    className="w-full rounded-lg bg-navy-950 border border-navy-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {tagsEdit.trim() && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tagsEdit.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} className="text-[10px] bg-navy-800 border border-navy-700 text-slate-400 px-1.5 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                  <textarea
                    value={descEdit}
                    onChange={(e) => setDescEdit(e.target.value)}
                    rows={4}
                    placeholder="Background, specialties, experience…"
                    className="w-full rounded-lg bg-navy-950 border border-navy-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Saved!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-9 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddMentorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newMentor) => {
            setMentors((prev) => [...prev, newMentor]);
          }}
        />
      )}
    </div>
  );
}
