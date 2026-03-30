import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      if (u?.role === "MENTOR") navigate("/mentor", { replace: true });
      else if (u?.role === "ADMIN") navigate("/admin", { replace: true });
      else navigate("/availability", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-2xl font-semibold text-white mb-1">Sign in</h1>
            <p className="text-slate-400 text-sm">Mentoring call scheduling</p>
          </div>
          {expired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm">
              Your session expired. Please sign in again.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-slate-500 text-xs">
            Demo accounts are created via the server seed script.
          </p>
        </div>
      </div>
    </div>
  );
}
