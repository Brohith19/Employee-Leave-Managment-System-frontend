import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1020",
    color: "#f3f6ff",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    padding: "20px 5%",
    background: "#111a30",
    borderBottom: "1px solid #253451",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  main: {
    padding: "32px 5%",
    maxWidth: 1500,
    margin: "0 auto",
  },
  card: {
    background: "#111a30",
    border: "1px solid #253451",
    borderRadius: 12,
    padding: 22,
    minWidth: 0,
  },
  button: {
    background: "#1769e0",
    color: "#fff",
    padding: "10px 15px",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    background: "#1a2942",
    color: "#dce8fa",
    padding: "10px 15px",
    border: "1px solid #344966",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 750,
  },
  th: {
    padding: "13px 12px",
    textAlign: "left",
    color: "#8eadd8",
    borderBottom: "1px solid #30415d",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #253451",
    color: "#dce6f7",
    fontSize: 13,
  },
  heading: {
    color: "#ffffff",
    fontWeight: 800,
  },
  dateInput: {
    background: "#0d172a",
    color: "#ffffff",
    padding: "10px 12px",
    border: "1px solid #344966",
    borderRadius: 7,
    fontSize: 14,
  },
};

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.employees)) return data.employees;
  return [];
}

function textValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "object") {
    return textValue(
      value.name ??
        value.fullName ??
        value.username ??
        value.label ??
        value.description ??
        value.value,
      fallback
    );
  }

  return fallback;
}

function dateKey(value) {
  if (!value) return null;

  // LocalDateTime values commonly arrive as "2026-10-11T10:30:00".
  // ISO date-time values with a timezone are converted to local time.
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) &&
    !/(Z|[+-]\d{2}:\d{2})$/i.test(value)
  ) {
    return value.slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function yesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function displaySubmissionTime(value) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function employeeName(request) {
  return (
    textValue(request?.employee?.fullName, "") ||
    textValue(request?.employee?.user?.username, "") ||
    textValue(request?.employeeName, "") ||
    (request?.employee?.id
      ? `Employee ${request.employee.id}`
      : "Employee")
  );
}

function leaveTypeName(request) {
  return textValue(
    request?.leaveType ??
      request?.type ??
      request?.leaveTypeName,
    "—"
  );
}

function statusColor(status) {
  switch (String(textValue(status, "UNKNOWN")).toUpperCase()) {
    case "APPROVED":
      return "#34d399";
    case "REJECTED":
      return "#fb7185";
    case "PENDING":
      return "#fbbf24";
    default:
      return "#93b7e8";
  }
}

function StatusBadge({ status }) {
  const value = String(textValue(status, "UNKNOWN")).toUpperCase();
  const color = statusColor(value);

  return (
    <span
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}50`,
        borderRadius: 20,
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const username =
    localStorage.getItem("username") ||
    sessionStorage.getItem("username") ||
    "Admin";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("TODAY");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/api/employees"),
        api.get("/api/leave-requests"),
      ]);

      const employeeResult = results[0];
      const requestResult = results[1];

      if (employeeResult.status === "fulfilled") {
        setEmployees(getList(employeeResult.value.data));
      } else {
        setEmployees([]);
        console.error("Unable to load employees:", employeeResult.reason);
      }

      if (requestResult.status === "fulfilled") {
        setRequests(getList(requestResult.value.data));
      } else {
        setRequests([]);
        console.error(
          "Unable to load leave requests:",
          requestResult.reason
        );
      }

      if (
        employeeResult.status === "rejected" &&
        requestResult.status === "rejected"
      ) {
        const httpStatus =
          employeeResult.reason?.response?.status ||
          requestResult.reason?.response?.status;

        setError(
          httpStatus
            ? `Admin APIs returned HTTP ${httpStatus}. Check backend permissions.`
            : "Unable to connect to the backend. Check that Spring Boot is running."
        );
      } else if (
        employeeResult.status === "rejected" ||
        requestResult.status === "rejected"
      ) {
        setError(
          "Some information could not be loaded. Check backend permissions."
        );
      }

      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const pendingCount = requests.filter(
    (request) =>
      String(textValue(request.status, "")).toUpperCase() === "PENDING"
  ).length;

  const approvedCount = requests.filter(
    (request) =>
      String(textValue(request.status, "")).toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = requests.filter(
    (request) =>
      String(textValue(request.status, "")).toUpperCase() === "REJECTED"
  ).length;

  const todayRequests = useMemo(
    () => requests.filter((request) => dateKey(request.appliedAt) === todayKey()),
    [requests]
  );

  const yesterdayRequests = useMemo(
    () =>
      requests.filter(
        (request) => dateKey(request.appliedAt) === yesterdayKey()
      ),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    let result;

    if (applicationFilter === "TODAY") {
      result = todayRequests;
    } else if (applicationFilter === "YESTERDAY") {
      result = yesterdayRequests;
    } else if (applicationFilter === "DATE") {
      result = selectedDate
        ? requests.filter(
            (request) => dateKey(request.appliedAt) === selectedDate
          )
        : [];
    } else if (applicationFilter === "UNDATED") {
      result = requests.filter((request) => !request.appliedAt);
    } else {
      result = requests;
    }

    if (statusFilter !== "ALL") {
      result = result.filter(
        (request) =>
          String(textValue(request.status, "")).toUpperCase() === statusFilter
      );
    }

    return [...result].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }, [
    requests,
    todayRequests,
    yesterdayRequests,
    applicationFilter,
    selectedDate,
    statusFilter,
  ]);

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "employees", label: "Employees", icon: "♙" },
    { id: "leaves", label: "All Leave Requests", icon: "▣" },
  ];

  function renderNavigation() {
    return (
      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          margin: "26px 0",
        }}
      >
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.secondaryButton,
              background:
                activeTab === tab.id ? "#203b62" : "#111a30",
              borderColor:
                activeTab === tab.id ? "#347cf0" : "#253451",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>
    );
  }

  function renderEmployeeTable() {
    return (
      <section style={styles.card}>
        <h2 style={{ ...styles.heading, marginTop: 0 }}>
          Employee Management
        </h2>

        <p style={{ color: "#c1d0e6", lineHeight: 1.7 }}>
          All registered employees in the system.
        </p>

        {loading ? (
          <p>Loading employees...</p>
        ) : employees.length === 0 ? (
          <p style={{ color: "#91a8c8" }}>No employees found.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Employee Code</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr key={employee.id ?? index}>
                    <td style={styles.td}>
                      <strong style={{ color: "#fff" }}>
                        {textValue(
                          employee.fullName ??
                            employee.user?.username ??
                            employee.username,
                          `Employee ${employee.id ?? index + 1}`
                        )}
                      </strong>
                    </td>
                    <td style={styles.td}>
                      {textValue(
                        employee.email ?? employee.user?.email
                      )}
                    </td>
                    <td style={styles.td}>
                      {textValue(employee.department)}
                    </td>
                    <td style={styles.td}>
                      {textValue(employee.employeeCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  function renderApplicationFilters() {
    const filters = [
      { id: "TODAY", label: "Submitted Today", count: todayRequests.length },
      {
        id: "YESTERDAY",
        label: "Submitted Yesterday",
        count: yesterdayRequests.length,
      },
      { id: "ALL", label: "All Applications", count: requests.length },
      {
        id: "UNDATED",
        label: "Missing Submission Date",
        count: requests.filter((request) => !request.appliedAt).length,
      },
    ];

    return (
      <>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            margin: "20px 0",
          }}
        >
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setApplicationFilter(filter.id)}
              style={{
                ...styles.secondaryButton,
                background:
                  applicationFilter === filter.id ? "#203b62" : "#0d172a",
                borderColor:
                  applicationFilter === filter.id ? "#347cf0" : "#344966",
              }}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <label htmlFor="application-date" style={{ fontWeight: 700 }}>
            Choose submission date:
          </label>

          <input
            id="application-date"
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setApplicationFilter("DATE");
            }}
            style={styles.dateInput}
          />

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => {
              setSelectedDate(todayKey());
              setApplicationFilter("TODAY");
            }}
          >
            Today
          </button>

          <select
            aria-label="Filter by request status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={styles.dateInput}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </>
    );
  }

  function renderLeaveRequests(showFilters = true) {
    const title =
      applicationFilter === "TODAY"
        ? "Leave Applications Submitted Today"
        : applicationFilter === "YESTERDAY"
          ? "Leave Applications Submitted Yesterday"
          : applicationFilter === "DATE"
            ? `Leave Applications Submitted on ${selectedDate || "Selected Date"}`
            : applicationFilter === "UNDATED"
              ? "Leave Applications Without Submission Dates"
              : "All Leave Requests";

    return (
      <section style={styles.card}>
        <h2 style={{ ...styles.heading, marginTop: 0 }}>
          {activeTab === "dashboard" ? "Recent Leave Requests" : title}
        </h2>

        <p style={{ color: "#c1d0e6", lineHeight: 1.7 }}>
          These lists use the submission timestamp, not the requested leave
          start date. Managers continue to handle approvals.
        </p>

        {showFilters && renderApplicationFilters()}

        {loading ? (
          <p style={{ color: "#93b7e8" }}>Loading leave requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p style={{ color: "#91a8c8", lineHeight: 1.7 }}>
            No applications match this filter. Existing requests without an
            `appliedAt` timestamp appear under Missing Submission Date.
          </p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Request ID</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Leave Type</th>
                  <th style={styles.th}>Applied Date</th>
                  <th style={styles.th}>Applied Time</th>
                  <th style={styles.th}>Leave Starts</th>
                  <th style={styles.th}>Leave Ends</th>
                  <th style={styles.th}>Days</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr key={request.id ?? index}>
                    <td style={styles.td}>#{request.id ?? "—"}</td>
                    <td style={styles.td}>
                      <strong style={{ color: "#fff" }}>
                        {employeeName(request)}
                      </strong>
                    </td>
                    <td style={styles.td}>{leaveTypeName(request)}</td>
                    <td style={styles.td}>
                      {displayDate(request.appliedAt)}
                    </td>
                    <td style={styles.td}>
                      {displaySubmissionTime(request.appliedAt)}
                    </td>
                    <td style={styles.td}>
                      {displayDate(request.startDate)}
                    </td>
                    <td style={styles.td}>
                      {displayDate(request.endDate)}
                    </td>
                    <td style={styles.td}>
                      {textValue(
                        request.numberOfDays ??
                          request.totalDays ??
                          request.days
                      )}
                    </td>
                    <td style={styles.td}>
                      <StatusBadge status={request.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  }

  function renderDashboard() {
    const cards = [
      {
        label: "Total Employees",
        value: employees.length,
        color: "#60a5fa",
      },
      {
        label: "Pending Requests",
        value: pendingCount,
        color: "#fbbf24",
      },
      {
        label: "Approved Requests",
        value: approvedCount,
        color: "#34d399",
      },
      {
        label: "Rejected Requests",
        value: rejectedCount,
        color: "#fb7185",
      },
    ];

    return (
      <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 18,
            marginBottom: 26,
          }}
        >
          {cards.map((card) => (
            <section key={card.label} style={styles.card}>
              <span style={{ color: "#c1d0e6", fontSize: 13 }}>
                {card.label}
              </span>
              <h2
                style={{
                  color: card.color,
                  fontSize: 32,
                  fontWeight: 800,
                  margin: "18px 0 0",
                }}
              >
                {loading ? "…" : card.value}
              </h2>
            </section>
          ))}
        </div>

        <section style={{ ...styles.card, marginBottom: 20 }}>
          <h2 style={{ ...styles.heading, marginTop: 0 }}>
            Quick Management
          </h2>

          <p style={{ color: "#c1d0e6", lineHeight: 1.7 }}>
            View employee details and monitor leave activity by submission date.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 20,
            }}
          >
            <button
              type="button"
              style={styles.button}
              onClick={() => setActiveTab("employees")}
            >
              View Employees
            </button>

            <button
              type="button"
              style={styles.button}
              onClick={() => {
                setApplicationFilter("TODAY");
                setStatusFilter("ALL");
                setActiveTab("leaves");
              }}
            >
              Today's Applications ({todayRequests.length})
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setApplicationFilter("YESTERDAY");
                setStatusFilter("ALL");
                setActiveTab("leaves");
              }}
            >
              Yesterday's Applications ({yesterdayRequests.length})
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setActiveTab("leaves")}
            >
              View All Applications
            </button>
          </div>
        </section>

        {renderLeaveRequests(false)}
      </>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2
            style={{
              color: "#5b9cff",
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            LeaveFlow
          </h2>
          <p style={{ color: "#c1d0e6", margin: "7px 0 0", fontSize: 13 }}>
            Employee Leave Management System
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 700 }}>
            Admin: {username}
          </span>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            style={styles.secondaryButton}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{ ...styles.button, background: "#d83b50" }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <p
          style={{
            color: "#60a5fa",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            marginBottom: 12,
          }}
        >
          ADMIN WORKSPACE
        </p>

        <h1
          style={{
            ...styles.heading,
            margin: "0 0 10px",
            fontSize: 32,
          }}
        >
          Admin Dashboard
        </h1>

        <p style={{ color: "#dce6f7", lineHeight: 1.7 }}>
          Welcome, {username}! Monitor employees and leave applications.
        </p>

        {lastUpdated && (
          <p style={{ color: "#91a8c8", fontSize: 12 }}>
            Last updated: {lastUpdated}
          </p>
        )}

        {renderNavigation()}

        {error && (
          <div
            role="alert"
            style={{
              background: "#321c2a",
              border: "1px solid #7f303e",
              color: "#fecdd3",
              padding: 16,
              borderRadius: 9,
              marginBottom: 20,
            }}
          >
            <strong>Data loading issue</strong>
            <p>{error}</p>
          </div>
        )}

        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "employees" && renderEmployeeTable()}
        {activeTab === "leaves" && renderLeaveRequests(true)}

        <footer
          style={{
            borderTop: "1px solid #253451",
            marginTop: 32,
            paddingTop: 20,
            color: "#91a8c8",
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span>LeaveFlow Admin Workspace</span>
          <span>Employee Leave Management System</span>
        </footer>
      </main>
    </div>
  );
}