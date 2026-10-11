
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ManagerDashboard.css";

function ManagerDashboard() {
  const navigate = useNavigate();

  const username =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username");

  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role");

  const [requests, setRequests] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!username) {
        throw new Error("Please log in to continue.");
      }

      const employeeResponse = await api.get(
        `/api/employees/username/${encodeURIComponent(username)}`
      );

      const id = employeeResponse.data?.id;

      if (!id) {
        throw new Error(
          "No employee profile was found for this manager account."
        );
      }

      setManagerId(id);

      const requestsResponse = await api.get(
        "/api/leave-requests/status/PENDING"
      );

      setRequests(
        Array.isArray(requestsResponse.data)
          ? requestsResponse.data
          : []
      );
    } catch (err) {
      console.error("Manager dashboard loading error:", err);

      const responseData = err.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || responseData?.error;

      setError(
        backendMessage ||
          (err.response
            ? `Request failed with status ${err.response.status}.`
            : err.message || "Unable to load the manager dashboard.")
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleDecision(requestId, decision) {
    if (!managerId) {
      setError("Manager ID is missing. Please log in again.");
      return;
    }

    const action = decision === "approve" ? "approve" : "reject";
    const comment = (comments[requestId] || "").trim();

    setProcessingId(requestId);
    setError("");
    setMessage("");

    try {
      await api.put(
        `/api/leave-approvals/${requestId}/${action}`,
        null,
        {
          params: {
            managerId,
            ...(comment ? { comment } : {}),
          },
        }
      );

      setMessage(
        `Leave request #${requestId} was ${
          decision === "approve" ? "approved" : "rejected"
        }.`
      );

      await loadDashboard();
    } catch (err) {
      console.error("Leave decision error:", err);

      const responseData = err.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || responseData?.error;

      setError(
        backendMessage ||
          (err.response
            ? `Unable to process request. HTTP ${err.response.status}.`
            : "Unable to connect to the backend.")
      );
    } finally {
      setProcessingId(null);
    }
  }

  function logout() {
    ["token", "username", "role"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/", { replace: true });
  }

  function formatDate(value) {
    if (!value) return "—";

    const parts = String(value).split("-");
    if (parts.length !== 3) return String(value);

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function getEmployeeName(request) {
    return (
      request.employee?.fullName ||
      request.employee?.user?.username ||
      "Employee"
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

  const totalDays = requests.reduce(
    (total, request) =>
      total + Number(request.numberOfDays || request.days || 0),
    0
  );

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
            className="manager-nav-item active"
            onClick={() => navigate("/manager-dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className="manager-nav-item"
            onClick={() => navigate("/manager-notifications")}
          >
            <span>♧</span> Notifications
          </button>

          <button
            className="manager-nav-item"
            onClick={loadDashboard}
            disabled={loading}
          >
            <span>↻</span> Refresh Requests
          </button>
        </nav>

        <div className="manager-sidebar-bottom">
          <div className="manager-account">
            <div className="manager-avatar">
              {username ? username.charAt(0).toUpperCase() : "M"}
            </div>

            <div className="manager-account-text">
              <strong>{username || "Manager"}</strong>
              <span>{role || "MANAGER"}</span>
            </div>
          </div>

          <button className="manager-logout" onClick={logout}>
            ⇥ Logout
          </button>
        </div>
      </aside>

      <main className="manager-main">
        <header className="manager-header">
          <div>
            <p className="manager-eyebrow">
              EMPLOYEEFLOW / MANAGEMENT
            </p>

            <h1>Manager Dashboard</h1>

            <p className="manager-subtitle">
              Review employee leave requests and manage decisions.
            </p>
          </div>

          <button
            className="manager-refresh-button"
            onClick={loadDashboard}
            disabled={loading}
          >
            ↻ {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        {error && (
          <div className="manager-alert manager-alert-error" role="alert">
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="manager-alert manager-alert-success" role="status">
            {message}
          </div>
        )}

        <section className="manager-stats">
          <article className="manager-stat-card">
            <div className="manager-stat-icon pending-icon">◷</div>
            <div>
              <span>Pending Requests</span>
              <strong>{loading ? "—" : requests.length}</strong>
            </div>
          </article>

          <article className="manager-stat-card">
            <div className="manager-stat-icon days-icon">▦</div>
            <div>
              <span>Total Requested Days</span>
              <strong>{loading ? "—" : totalDays}</strong>
            </div>
          </article>

          <article className="manager-stat-card">
            <div className="manager-stat-icon manager-icon">♙</div>
            <div>
              <span>Manager Account</span>
              <strong className="manager-account-value">
                {username || "Unknown"}
              </strong>
            </div>
          </article>
        </section>

        <section className="manager-requests-card">
          <div className="manager-requests-heading">
            <div>
              <h2>Pending Leave Requests</h2>
              <p>Review each request before making a decision.</p>
            </div>

            <span className="manager-count-badge">
              {requests.length} pending
            </span>
          </div>

          {loading && (
            <div className="manager-empty-state">
              <div className="manager-loading-spinner" />
              <p>Loading leave requests...</p>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="manager-empty-state">
              <div className="manager-empty-icon">✓</div>
              <h3>No pending requests</h3>
              <p>
                There are no pending leave requests to review right now.
              </p>
            </div>
          )}

          {!loading && requests.length > 0 && (
            <div className="manager-request-list">
              {requests.map((request) => (
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
                      <strong>
                        {request.numberOfDays || request.days || 0} day(s)
                      </strong>
                    </div>
                  </div>

                  <div className="manager-reason">
                    <span>Reason for leave</span>
                    <p>{request.reason || "No reason provided."}</p>
                  </div>

                  <label
                    className="manager-comment-label"
                    htmlFor={`comment-${request.id}`}
                  >
                    Manager comment <span>(optional)</span>
                  </label>

                  <textarea
                    id={`comment-${request.id}`}
                    className="manager-comment-input"
                    placeholder="Add a comment for this decision..."
                    rows={2}
                    value={comments[request.id] || ""}
                    onChange={(event) =>
                      setComments((previous) => ({
                        ...previous,
                        [request.id]: event.target.value,
                      }))
                    }
                    disabled={processingId === request.id}
                  />

                  <div className="manager-request-actions">
                    <button
                      className="manager-reject-button"
                      onClick={() => handleDecision(request.id, "reject")}
                      disabled={processingId !== null}
                    >
                      {processingId === request.id
                        ? "Processing..."
                        : "✕ Reject"}
                    </button>

                    <button
                      className="manager-approve-button"
                      onClick={() => handleDecision(request.id, "approve")}
                      disabled={processingId !== null}
                    >
                      {processingId === request.id
                        ? "Processing..."
                        : "✓ Approve"}
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

export default ManagerDashboard;
