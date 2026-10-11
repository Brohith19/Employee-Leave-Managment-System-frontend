
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Read authentication data from either storage location.
  const username =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "";

  const role = (
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    ""
  )
    .replace(/^ROLE_/i, "")
    .toUpperCase();

  const [leaveBalance, setLeaveBalance] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");

    navigate("/", { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      setLoading(true);
      setDataError("");

      try {
        const [balanceResponse, pendingResponse] = await Promise.all([
          api.get(
            "/api/leave-balances/my-balance?username=" +
              encodeURIComponent(username)
          ),
          api.get(
            "/api/leave-requests/my-pending?username=" +
              encodeURIComponent(username)
          ),
        ]);

        if (cancelled) return;

        const balances = Array.isArray(balanceResponse.data)
          ? balanceResponse.data
          : [];

        const pending = Array.isArray(pendingResponse.data)
          ? pendingResponse.data
          : [];

        setLeaveBalance(balances.length > 0 ? balances[0] : null);
        setPendingRequests(pending.length);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load dashboard data:", error);
          setDataError(
            "Dashboard opened, but leave information could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (username && role === "EMPLOYEE") {
      fetchDashboardData();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [username, role]);

  const totalLeave = leaveBalance?.totalDays ?? 0;
  const remainingLeave = leaveBalance?.remainingDays ?? 0;
  const usedLeave = leaveBalance?.usedDays ?? 0;

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">EL</div>
          <span>EmployeeFlow</span>
        </div>

        <nav>
          <button
            className="nav-item active"
            onClick={() => navigate("/dashboard")}
          >
            🏠 Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/apply-leave")}
          >
            📅 Apply Leave
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/leave-balance")}
          >
            📊 Leave Balance
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/my-requests")}
          >
            📋 My Requests
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/notifications")}
          >
            🔔 Notifications
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/profile")}
          >
            👤 Profile
          </button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-small-title">EMPLOYEE PORTAL</p>
            <h1>Welcome back, {username || "User"} 👋</h1>
            <p>Here's what's happening with your leave management.</p>
          </div>

          <div className="profile-badge">
            <div className="profile-avatar">
              {username ? username.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <strong>{username || "User"}</strong>
              <span>{role || "Employee"}</span>
            </div>
          </div>
        </header>

        {dataError && (
          <p role="alert" style={{ color: "#e5484d", marginTop: "16px" }}>
            {dataError}
          </p>
        )}

        <section className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon">📅</div>
            <div>
              <span>Total Leave</span>
              <strong>{loading ? "..." : totalLeave}</strong>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">✓</div>
            <div>
              <span>Remaining Leave</span>
              <strong>{loading ? "..." : remainingLeave}</strong>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">⏳</div>
            <div>
              <span>Pending Requests</span>
              <strong>{loading ? "..." : pendingRequests}</strong>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">✓</div>
            <div>
              <span>Used Leave</span>
              <strong>{loading ? "..." : usedLeave}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Frequently used options</p>
            </div>
          </div>

          <div className="action-grid">
            <button
              className="action-card"
              onClick={() => navigate("/apply-leave")}
            >
              <div className="action-icon">📅</div>
              <div>
                <strong>Apply for Leave</strong>
                <span>Submit a new leave request</span>
              </div>
              <b>→</b>
            </button>

            <button
              className="action-card"
              onClick={() => navigate("/leave-balance")}
            >
              <div className="action-icon">📊</div>
              <div>
                <strong>Check Balance</strong>
                <span>View your available leaves</span>
              </div>
              <b>→</b>
            </button>

            <button
              className="action-card"
              onClick={() => navigate("/my-requests")}
            >
              <div className="action-icon">📋</div>
              <div>
                <strong>My Requests</strong>
                <span>Track your leave requests</span>
              </div>
              <b>→</b>
            </button>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Recent Activity</h2>
              <p>Your latest leave activity</p>
            </div>
          </div>

          <div className="empty-state">
            <div>📭</div>
            <h3>No recent activity</h3>
            <p>Your latest leave requests will appear here.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
