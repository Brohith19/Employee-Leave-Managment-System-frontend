import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import MyRequests from "./pages/MyRequests";
import LeaveBalance from "./pages/LeaveBalance";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function getAuthData() {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const role = (
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    ""
  ).toUpperCase();

  return { token, role };
}

function getHomePath(role) {
  if (role === "MANAGER") return "/manager-dashboard";
  if (role === "ADMIN") return "/admin-dashboard";
  if (role === "EMPLOYEE") return "/dashboard";
  return "/";
}

function ProtectedRoute({ children, allowedRoles }) {
  const { token, role } = getAuthData();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getHomePath(role)} replace />;
  }

  return children;
}

function HomeRoute() {
  const { token, role } = getAuthData();

  if (token && ["EMPLOYEE", "MANAGER", "ADMIN"].includes(role)) {
    return <Navigate to={getHomePath(role)} replace />;
  }

  return <Login />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply-leave"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <ApplyLeave />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-requests"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-balance"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <LeaveBalance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager-notifications"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRoles={["MANAGER"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;