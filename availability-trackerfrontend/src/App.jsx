import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import UserAvailability from "./pages/UserAvailability";
import MentorAvailability from "./pages/MentorAvailability";
import AdminSettings from "./pages/AdminSettings";
import AdminSchedule from "./pages/AdminSchedule";
import AdminBookings from "./pages/AdminBookings";
import AdminUsers from "./pages/AdminUsers";
import AdminMentors from "./pages/AdminMentors";

const LOGIN_PATH = "/login";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const loginTo = location.search ? `${LOGIN_PATH}${location.search}` : LOGIN_PATH;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginTo} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to={LOGIN_PATH} replace />;
  if (user.role === "MENTOR") return <Navigate to="/mentor" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin/schedule" replace />;
  return <Navigate to="/availability" replace />;
}

function NormalizePathname({ children }) {
  const location = useLocation();
  const pathname = location.pathname;
  if (pathname.startsWith("//")) {
    const fixed = pathname.replace(/\/+/g, "/") + location.search;
    return <Navigate to={fixed} replace />;
  }
  return children;
}

export default function App() {
  return (
    <NormalizePathname>
      <Routes>
        <Route path={LOGIN_PATH} element={<Login />} />

        {/* User / Mentor routes — top-nav Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DefaultRedirect />} />
          <Route
            path="availability"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <UserAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="mentor"
            element={
              <ProtectedRoute allowedRoles={["MENTOR"]}>
                <MentorAvailability />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin routes — sidebar AdminLayout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/schedule" replace />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="mentors" element={<AdminMentors />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NormalizePathname>
  );
}
