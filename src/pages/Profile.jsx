
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Profile.css";

function getStoredValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function Profile() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(() => getStoredValue("username"));
  const [role, setRole] = useState(() => getStoredValue("role"));
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    const currentUsername = getStoredValue("username");
    const currentRole = getStoredValue("role");

    setUsername(currentUsername);
    setRole(currentRole);
    setEmployee(null);
    setError("");

    if (!currentUsername) {
      setError(
        "Your login username was not found. Please sign in again."
      );
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(
        `/api/employees/username/${encodeURIComponent(currentUsername)}`
      );

      if (!response.data) {
        throw new Error("The server returned an empty employee profile.");
      }

      setEmployee(response.data);
    } catch (err) {
      console.error("Profile loading error:", err);

      const status = err.response?.status;

      if (status === 401) {
        setError("Your session could not be authenticated. Please sign in again.");
      } else if (status === 403) {
        setError("Your account does not have permission to view this profile.");
      } else if (status === 404) {
        setError("No employee profile was found for this username.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Unable to load your profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function logout() {
    ["token", "username", "role"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/", { replace: true });
  }

  function displayValue(value) {
    return value === null || value === undefined || value === ""
      ? "Not provided"
      : value;
  }

  const fullName = employee?.fullName;

  return (
    <div className="profile-page">
      <aside className="sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">EL</div>
          <span>EmployeeFlow</span>
        </div>

        <p className="profile-nav-heading">WORKSPACE</p>

        <nav className="profile-navigation">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="profile-nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/apply-leave")}>
            <span className="profile-nav-icon">＋</span>
            <span>Apply Leave</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/leave-balance")}>
            <span className="profile-nav-icon">▥</span>
            <span>Leave Balance</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/my-requests")}>
            <span className="profile-nav-icon">▤</span>
            <span>My Requests</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/notifications")}>
            <span className="profile-nav-icon">♧</span>
            <span>Notifications</span>
          </button>

          <button className="nav-item active" onClick={() => navigate("/profile")}>
            <span className="profile-nav-icon">♙</span>
            <span>Profile</span>
          </button>
        </nav>

        <div className="profile-sidebar-footer">
          <div className="profile-sidebar-user">
            <div className="profile-mini-avatar">
              {String(username || "U").charAt(0).toUpperCase()}
            </div>

            <div className="profile-sidebar-user-info">
              <strong>{username || "User"}</strong>
              <span>{role || "EMPLOYEE"}</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="profile-main">
        <header className="profile-page-header">
          <div>
            <p className="profile-eyebrow">EMPLOYEE PORTAL / ACCOUNT</p>
            <h1>My Profile</h1>
            <p className="profile-header-description">
              View your employee details and account information.
            </p>
          </div>

          <button
            className="profile-back-button"
            onClick={() => navigate("/dashboard")}
          >
            <span>←</span> Dashboard
          </button>
        </header>

        {loading && (
          <div className="profile-message">
            <span className="profile-spinner" />
            <span>Loading your profile...</span>
          </div>
        )}

        {!loading && error && (
          <div className="profile-message profile-error">
            <div className="profile-error-icon">!</div>
            <div className="profile-error-content">
              <h3>Profile unavailable</h3>
              <p>{error}</p>
              <button
                className="profile-primary-button"
                onClick={loadProfile}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && employee && (
          <>
            <section className="profile-summary-card">
              <div className="profile-large-avatar">
                {String(fullName || username || "U").charAt(0).toUpperCase()}
              </div>

              <div className="profile-summary-text">
                <span className="profile-card-eyebrow">EMPLOYEE ACCOUNT</span>
                <h2>{displayValue(fullName)}</h2>
                <p>Employee ID: {displayValue(employee.employeeCode)}</p>

                <div className="profile-badges">
                  <span className="profile-role-badge">
                    <span className="profile-status-dot" />
                    {role || "EMPLOYEE"}
                  </span>
                  <span className="profile-account-badge">
                    Account Information
                  </span>
                </div>
              </div>

              <div className="profile-summary-decoration">
                <div className="profile-decoration-circle">EL</div>
              </div>
            </section>

            <section className="profile-details-card">
              <div className="profile-section-heading">
                <div>
                  <h2>Employee Information</h2>
                  <p>Your registered employee details</p>
                </div>
                <div className="profile-section-icon">▤</div>
              </div>

              <div className="profile-details-grid">
                <div className="profile-detail">
                  <span className="profile-detail-label">Employee Name</span>
                  <strong>{displayValue(fullName)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Employee ID</span>
                  <strong>{displayValue(employee.employeeCode)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Email Address</span>
                  <strong>{displayValue(employee.email)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Phone Number</span>
                  <strong>{displayValue(employee.phone)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Department</span>
                  <strong>{displayValue(employee.department?.name)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Joining Date</span>
                  <strong>{displayValue(employee.joiningDate)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Login Username</span>
                  <strong>{displayValue(username)}</strong>
                </div>

                <div className="profile-detail">
                  <span className="profile-detail-label">Account Role</span>
                  <strong>{displayValue(role)}</strong>
                </div>
              </div>
            </section>

            <div className="profile-note">
              <span className="profile-note-icon">i</span>
              <p>
                <strong>Need to update your details?</strong>
                <span>
                  If any information is missing or incorrect, contact your
                  administrator to update your employee record.
                </span>
              </p>
            </div>
          </>
        )}

        <footer className="profile-page-footer">
          <span>EmployeeFlow</span>
          <span>Employee Portal</span>
        </footer>
      </main>
    </div>
  );
}

export default Profile;
