
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./LeaveBalance.css";

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function LeaveBalance() {
  const navigate = useNavigate();

  const username = getStoredValue("username");
  const role = getStoredValue("role")
    .replace(/^ROLE_/i, "")
    .toUpperCase();

  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBalances(cancelledRef) {
    if (!username) {
      setError("Please log in to view your leave balance.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/api/leave-balances/my-balance",
        {
          params: { username },
        }
      );

      if (cancelledRef.cancelled) return;

      setBalances(
        Array.isArray(response.data)
          ? response.data
          : response.data
            ? [response.data]
            : []
      );
    } catch (err) {
      if (cancelledRef.cancelled) return;

      console.error(
        "Leave balance request failed:",
        err.response?.status,
        err.response?.data || err.message
      );

      const status = err.response?.status;

      if (status === 401) {
        setError("Your login session has expired. Please sign in again.");
      } else if (status === 403) {
        setError(
          "Access denied by the backend. Please check employee permissions in Spring Security."
        );
      } else if (status === 404) {
        setError(
          "The leave balance API endpoint was not found. Check the backend controller URL."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load your leave balance. Check that the backend is running."
        );
      }
    } finally {
      if (!cancelledRef.cancelled) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const cancelledRef = { cancelled: false };

    loadBalances(cancelledRef);

    return () => {
      cancelledRef.cancelled = true;
    };
  }, [username]);

  function logout() {
    for (const storage of [localStorage, sessionStorage]) {
      storage.removeItem("token");
      storage.removeItem("username");
      storage.removeItem("role");
    }

    navigate("/", { replace: true });
  }

  const totalDays = balances.reduce(
    (sum, balance) => sum + Number(balance.totalDays || 0),
    0
  );

  const usedDays = balances.reduce(
    (sum, balance) => sum + Number(balance.usedDays || 0),
    0
  );

  const remainingDays = balances.reduce(
    (sum, balance) => sum + Number(balance.remainingDays || 0),
    0
  );

  const usedPercentage =
    totalDays > 0
      ? Math.min(100, Math.max(0, (usedDays / totalDays) * 100))
      : 0;

  return (
    <div className="leave-balance-page">
      <aside className="sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">EL</div>
          <span>EmployeeFlow</span>
        </div>

        <p className="balance-nav-label">WORKSPACE</p>

        <nav>
          <button
            className="nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>⌂</span> Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/apply-leave")}
          >
            <span>＋</span> Apply Leave
          </button>

          <button className="nav-item active">
            <span>▥</span> Leave Balance
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/my-requests")}
          >
            <span>▤</span> My Requests
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/notifications")}
          >
            <span>♧</span> Notifications
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/profile")}
          >
            <span>◉</span> Profile
          </button>
        </nav>

        <div className="balance-sidebar-footer">
          <div className="balance-sidebar-user">
            <div className="balance-mini-avatar">
              {username ? username.charAt(0).toUpperCase() : "U"}
            </div>

            <div>
              <strong>{username || "User"}</strong>
              <span>{role || "Employee"}</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="leave-balance-main">
        <header className="balance-header">
          <div>
            <p className="balance-small-title">
              EMPLOYEE WORKSPACE / LEAVE MANAGEMENT
            </p>
            <h1>My Leave Balance</h1>
            <p>
              Track your leave entitlement, used days, and remaining balance.
            </p>
          </div>

          <div className="balance-header-badge">
            <div className="balance-header-icon">▥</div>
            <div>
              <strong>Leave Center</strong>
              <span>Balance overview</span>
            </div>
          </div>
        </header>

        {!loading && !error && balances.length > 0 && (
          <>
            <section className="balance-summary-grid">
              <article className="balance-summary-card">
                <div className="balance-summary-top">
                  <span>TOTAL ALLOCATED</span>
                  <div className="balance-summary-icon icon-blue">▥</div>
                </div>
                <strong>{totalDays}</strong>
                <p>Days available for the year</p>
              </article>

              <article className="balance-summary-card">
                <div className="balance-summary-top">
                  <span>LEAVE USED</span>
                  <div className="balance-summary-icon icon-amber">◷</div>
                </div>
                <strong>{usedDays}</strong>
                <p>Days already used</p>
              </article>

              <article className="balance-summary-card">
                <div className="balance-summary-top">
                  <span>REMAINING</span>
                  <div className="balance-summary-icon icon-green">✓</div>
                </div>
                <strong>{remainingDays}</strong>
                <p>Days remaining to use</p>
              </article>
            </section>

            <section className="balance-usage-card">
              <div className="balance-usage-heading">
                <div>
                  <h2>Leave usage overview</h2>
                  <p>
                    Your overall leave usage across allocated leave types.
                  </p>
                </div>
                <strong>{Math.round(usedPercentage)}% used</strong>
              </div>

              <div className="balance-progress-track">
                <div
                  className="balance-progress-fill"
                  style={{ width: `${usedPercentage}%` }}
                />
              </div>

              <div className="balance-usage-footer">
                <span>{usedDays} days used</span>
                <span>{remainingDays} days remaining</span>
              </div>
            </section>
          </>
        )}

        <section className="balance-details-section">
          <div className="balance-section-heading">
            <div>
              <h2>Leave breakdown</h2>
              <p>View your allocation for each leave category.</p>
            </div>

            {!loading && !error && balances.length > 0 && (
              <span className="balance-count-pill">
                {balances.length} leave types
              </span>
            )}
          </div>

          {loading && (
            <div className="balance-message">
              <div className="balance-spinner" />
              <h3>Loading your leave balance</h3>
              <p>Please wait while we retrieve your leave details.</p>
            </div>
          )}

          {!loading && error && (
            <div className="balance-message error-message">
              <div className="balance-message-icon">!</div>
              <h3>Unable to load balance</h3>
              <p>{error}</p>
              <button
                className="balance-primary-button"
                onClick={() => {
                  const cancelledRef = { cancelled: false };
                  loadBalances(cancelledRef);
                }}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && balances.length === 0 && (
            <div className="balance-message">
              <div className="balance-message-icon">▥</div>
              <h3>No leave balance found</h3>
              <p>
                Please contact your administrator to assign a leave balance.
              </p>
            </div>
          )}

          {!loading && !error && balances.length > 0 && (
            <div className="balance-grid">
              {balances.map((balance, index) => {
                const total = Number(balance.totalDays || 0);
                const used = Number(balance.usedDays || 0);
                const remaining = Number(balance.remainingDays || 0);

                const percentage =
                  total > 0
                    ? Math.min(100, Math.max(0, (used / total) * 100))
                    : 0;

                const leaveName =
                  balance.leaveType?.name ||
                  balance.leaveType?.type ||
                  "Leave";

                return (
                  <article
                    className="balance-card"
                    key={balance.id ?? `${leaveName}-${balance.year ?? index}`}
                  >
                    <div className="balance-card-top">
                      <div className="balance-card-icon">▥</div>
                      <span className="balance-year">
                        {balance.year || "Current year"}
                      </span>
                    </div>

                    <h3>{leaveName}</h3>
                    <p className="balance-description">
                      Your allocated leave balance
                    </p>

                    <div className="balance-card-remaining">
                      <strong>{remaining}</strong>
                      <span>days remaining</span>
                    </div>

                    <div className="balance-numbers">
                      <div>
                        <span>Total</span>
                        <strong>{total}</strong>
                      </div>
                      <div>
                        <span>Used</span>
                        <strong>{used}</strong>
                      </div>
                      <div>
                        <span>Remaining</span>
                        <strong>{remaining}</strong>
                      </div>
                    </div>

                    <div className="balance-progress-track">
                      <div
                        className="balance-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className="balance-progress-label">
                      {Math.round(percentage)}% of allocated leave used
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="balance-page-footer">
          <span>EmployeeFlow</span>
          <span>Leave management · Balance overview</span>
        </footer>
      </main>
    </div>
  );
}

export default LeaveBalance;
