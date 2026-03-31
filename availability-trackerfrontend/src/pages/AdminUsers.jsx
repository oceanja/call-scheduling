import { useState, useEffect, useCallback } from "react";
import * as adminApi from "../api/admin";
import AddUserModal from "../components/AddUserModal";

function TagBadge({ tag }) {
  return (
    <span className="text-[11px] bg-navy-800 border border-navy-700 text-slate-400 px-1.5 py-0.5 rounded-md">
      {tag}
    </span>
  );
}

function UserCard({ user }) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-xl p-4 hover:border-slate-600 transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sky-600/30 border border-sky-500/30 flex items-center justify-center text-sky-300 text-sm font-bold flex-shrink-0">
            {(user.name || user.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.name || "—"}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full shrink-0">
          USER
        </span>
      </div>

      {user.description && (
        <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">{user.description}</p>
      )}

      {user.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
        </div>
      )}

      {!user.description && (!user.tags || user.tags.length === 0) && (
        <p className="text-xs text-slate-600 italic">No profile info added yet.</p>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : users;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} registered users</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
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
          placeholder="Search users by name, email or tag…"
          className="w-full h-10 pl-9 pr-4 rounded-lg bg-navy-900 border border-navy-700 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-8">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-primary-500 rounded-full animate-spin" />
          Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
          </svg>
          <p className="text-sm">{search ? "No users match your search." : "No users yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((u) => <UserCard key={u.id} user={u} />)}
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newUser) => {
            setUsers((prev) => [...prev, newUser]);
          }}
        />
      )}
    </div>
  );
}
