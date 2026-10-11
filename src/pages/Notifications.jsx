import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Notifications.css";


function getStoredValue(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getEmployeeName(request) {
  return (
    request.employee?.fullName ||
    request.employee?.user?.username ||
    (request.employee?.id ? `Employee ${request.employee.id}` : "Employee")
  );
}

function getLeaveType(request) {
  return (
    request.leaveType?.name ||
    request.leaveType?.leaveTypeName ||
    request.leaveType?.typeName ||
    "Leave"
  );
}

function getNotificationTitle(notification) {
  return (
    notification.title ||
    notification.subject ||
    notification.type ||
    "Notification"
  );
}

function getNotificationMessage(notification) {
  return (
    notification.message ||
    notification.content ||
    notification.description ||
    "No message provided."
  );
}

function getNotificationDate(notification) {
  const value =
    notification.createdAt ||
    notification.createdDate ||
    notification.date;

  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-IN");
}

function Notifications() {
  const navigate = useNavigate();
  const username = getStoredValue("username") || "";
  const role = (getStoredValue("role") || "").toUpperCase();
  const isManager = role === "MANAGER";

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const unreadCount = isManager
    ? 0
    : notifications.filter((item) => item.isRead !== true).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    setActionError("");

    try {
      if (!username) {
        throw new Error("Please log in to continue.");
      }

      if (isManager) {
        const response = await api.get(
          "/api/leave-requests/status/PENDING"
        );

        setNotifications(
          Array.isArray(response.data) ? response.data : []
        );
      } else {
        const response = await api.get("/api/notifications/mine");
        const data = response.data;

        setNotifications(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.content)
              ? data.content
              : []
        );
      }
    } catch (err) {
      console.error("Notifications loading error:", err);
      setNotifications([]);

      const data = err.response?.data;
      setError(
        (typeof data === "string" ? data : data?.message || data?.error) ||
          err.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, [username, isManager]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(notificationId) {
    setMarkingId(notificationId);
    setActionError("");

    try {
      await api.put(`/api/notifications/mine/${notificationId}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      console.error("Mark notification as read error:", err);

      const data = err.response?.data;
      setActionError(
        (typeof data === "string" ? data : data?.message || data?.error) ||
          "Unable to mark this notification as read. Please try again."
      );
    } finally {
      setMarkingId(null);
    }
  }

  function logout() {
    ["token", "username", "role"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/", { replace: true });
  }

  if (isManager) {
    return (
      <div className="manager-page">
        <aside className="manager-sidebar">
          <div className="manager-logo">
            <div className="manager-logo-icon">EL</div>
            <span>EmployeeFlow</span>
          </div>

          <div className="manager-sidebar-label">MANAGEMENT</div>

          <nav className="manager-nav">
            <button
              className="manager-nav-item"
              onClick={() => navigate("/manager-dashboard")}
            >
              Dashboard
            </button>

            <button
              className="manager-nav-item active"
              onClick={() => navigate("/manager-notifications")}
            >
              Notifications
            </button>

            <button
              className="manager-nav-item"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh Requests"}
            </button>
          </nav>

          <div className="manager-sidebar-bottom">
            <div className="manager-account">
              <div className="manager-avatar">
                {username.charAt(0).toUpperCase() || "M"}
              </div>

              <div className="manager-account-text">
                <strong>{username || "Manager"}</strong>
                <span>MANAGER</span>
              </div>
            </div>

            <button className="manager-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        <main className="manager-main">
          <header className="manager-header">
            <div>
              <p className="manager-eyebrow">
                EMPLOYEEFLOW / MANAGEMENT
              </p>
              <h1>Manager Notifications</h1>
              <p className="manager-subtitle">
                Review employee leave requests waiting for your decision.
              </p>
            </div>

            <button
              className="manager-refresh-button"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </header>

          {error && (
            <div className="manager-alert manager-alert-error" role="alert">
              <strong>Unable to load requests</strong>
              <p>{error}</p>
            </div>
          )}

          <section className="manager-requests-card">
            <div className="manager-requests-heading">
              <div>
                <h2>Pending Leave Requests</h2>
                <p>Review employee details before making a decision.</p>
              </div>
              <span className="manager-count-badge">
                {notifications.length} pending
              </span>
            </div>

            {loading && (
              <div className="manager-empty-state">
                <p>Loading leave requests...</p>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="manager-empty-state">
                <h3>No pending requests</h3>
                <p>
                  There are no pending employee leave requests right now.
                </p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <div className="manager-request-list">
                {notifications.map((request) => (
                  <article className="manager-request" key={request.id}>
                    <div className="manager-request-top">
                      <div className="manager-employee">
                        <div className="manager-employee-avatar">
                          {getEmployeeName(request).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3>{getEmployeeName(request)}</h3>
                          <span>Request #{request.id}</span>
                        </div>
                      </div>

                      <span className="manager-status">
                        {request.status || "PENDING"}
                      </span>
                    </div>

                    <div className="manager-request-details">
                      <div className="manager-detail">
                        <span>Leave type</span>
                        <strong>{getLeaveType(request)}</strong>
                      </div>
                      <div className="manager-detail">
                        <span>Start date</span>
                        <strong>{formatDate(request.startDate)}</strong>
                      </div>
                      <div className="manager-detail">
                        <span>End date</span>
                        <strong>{formatDate(request.endDate)}</strong>
                      </div>
                      <div className="manager-detail">
                        <span>Duration</span>
                        <strong>{request.numberOfDays ?? 0} day(s)</strong>
                      </div>
                    </div>

                    <div className="manager-reason">
                      <span>Reason for leave</span>
                      <p>{request.reason || "No reason provided."}</p>
                    </div>

                    {request.managerComment && (
                      <div className="manager-reason">
                        <span>Manager comment</span>
                        <p>{request.managerComment}</p>
                      </div>
                    )}

                    <div className="manager-request-actions">
                      <button
                        className="manager-approve-button"
                        onClick={() => navigate("/manager-dashboard")}
                      >
                        View Request
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="manager-footer">
            EmployeeFlow Leave Management System
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <aside className="sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">EL</div>
          <span>EmployeeFlow</span>
        </div>

        <p className="notifications-nav-heading">WORKSPACE</p>

        <nav className="notifications-navigation">
          <button className="nav-item" onClick={() => navigate("/dashboard")}>
            <span className="notifications-nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/apply-leave")}>
            <span className="notifications-nav-icon">＋</span>
            <span>Apply Leave</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/leave-balance")}
          >
            <span className="notifications-nav-icon">▤</span>
            <span>Leave Balance</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/my-requests")}>
            <span className="notifications-nav-icon">▣</span>
            <span>My Requests</span>
          </button>

          <button
            className="nav-item active"
            onClick={() => navigate("/notifications")}
          >
            <span className="notifications-nav-icon">♧</span>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="nav-unread-badge">{unreadCount}</span>
            )}
          </button>

          <button className="nav-item" onClick={() => navigate("/profile")}>
            <span className="notifications-nav-icon">◎</span>
            <span>Profile</span>
          </button>
        </nav>

        <div className="notifications-sidebar-footer">
          <div className="notifications-sidebar-user">
            <div className="notifications-mini-avatar">
              {username.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="notifications-sidebar-user-info">
              <strong>{username || "User"}</strong>
              <span>EMPLOYEE</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="notifications-main">
        <header className="notifications-header">
          <div>
            <p className="notifications-eyebrow">
              EMPLOYEE PORTAL / ACTIVITY
            </p>
            <h1>Notifications</h1>
            <p className="notifications-header-description">
              Stay updated on your leave requests and account activity.
            </p>
          </div>

          <div className="notifications-user">
            <div className="notifications-avatar">
              {username.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="notifications-user-details">
              <strong>{username || "User"}</strong>
              <span>EMPLOYEE</span>
            </div>
          </div>
        </header>

        <section className="notifications-card">
          <div className="notifications-section-heading">
            <div>
              <h2>All Notifications</h2>
              <p>Your recent updates and activity</p>
            </div>

            <div className="notifications-summary">
              <span className="notifications-count">
                {notifications.length} total
              </span>
              <span className="notifications-unread-count">
                {unreadCount} unread
              </span>
            </div>
          </div>

          <div className="notifications-toolbar">
            <div className="notifications-toolbar-label">
              <span className="notifications-toolbar-dot" />
              Notification history
            </div>

            <button
              className="notifications-refresh"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {actionError && (
            <div className="notifications-error" role="alert">
              {actionError}
            </div>
          )}

          {error && (
            <div className="notifications-state notifications-error" role="alert">
              <h3>Unable to load notifications</h3>
              <p>{error}</p>
              <button
                className="notifications-primary-button"
                onClick={loadNotifications}
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className="notifications-state">
              Loading notifications...
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">♧</div>
              <h3>No notifications yet</h3>
              <p>Updates about your leave requests will appear here.</p>
              <button
                className="notifications-secondary-button"
                onClick={loadNotifications}
              >
                Check Again
              </button>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="notifications-list">
              {notifications.map((notification, index) => {
                const unread = notification.isRead !== true;
                const busy = markingId === notification.id;

                return (
                  <article
                    className={`notification-item ${
                      unread ? "notification-unread" : "notification-read"
                    }`}
                    key={notification.id ?? index}
                  >
                    <div className="notification-icon">
                      {unread ? "●" : "✓"}
                    </div>

                    <div className="notification-content">
                      <div className="notification-title-row">
                        <h3>{getNotificationTitle(notification)}</h3>
                        {unread ? (
                          <span className="notification-unread-label">
                            Unread
                          </span>
                        ) : (
                          <span className="notification-read-label">Read</span>
                        )}
                      </div>

                      <p>{getNotificationMessage(notification)}</p>

                      <div className="notification-date">
                        {getNotificationDate(notification)}
                      </div>

                      {unread && (
                        <button
                          className="notification-mark-read"
                          onClick={() => markAsRead(notification.id)}
                          disabled={busy || !notification.id}
                        >
                          {busy ? "Saving..." : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="notifications-page-footer">
          <span>EmployeeFlow</span>
          <span>Employee Portal</span>
        </footer>
      </main>
    </div>
  );
}

export default Notifications;