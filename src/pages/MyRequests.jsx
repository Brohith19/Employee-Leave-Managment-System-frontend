import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "./MyRequests.css";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/leave-requests/mine");
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : [];

      setRequests(list);
    } catch (err) {
      console.error("Failed to load leave requests:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your leave requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Safely display strings, numbers, and objects.
  const displayValue = (value, fallback = "—") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (typeof value === "string" || typeof value === "number") {
      return value;
    }

    if (typeof value === "object") {
      if (value.name != null) return displayValue(value.name, fallback);
      if (value.label != null) return displayValue(value.label, fallback);
      if (value.description != null) {
        return displayValue(value.description, fallback);
      }
      if (value.value != null) return displayValue(value.value, fallback);
      return fallback;
    }

    return fallback;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return displayValue(value);
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const normalizeStatus = (status) =>
    String(displayValue(status, "PENDING")).toUpperCase();

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
      case "APPROVED":
        return "approved";
      case "REJECTED":
        return "rejected";
      case "PENDING":
        return "pending";
      default:
        return "default";
    }
  };

  const getLeaveDays = (request) => {
    const totalDays = request.totalDays ?? request.days;

    if (
      totalDays !== null &&
      totalDays !== undefined &&
      typeof totalDays !== "object"
    ) {
      return totalDays;
    }

    if (!request.startDate || !request.endDate) return "—";

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return "—";
    }

    const difference =
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

    return difference > 0 ? difference : "—";
  };

  const getLeaveType = (request) => {
    const value = request.leaveType ?? request.type;

    if (value && typeof value === "object") {
      return displayValue(value.name ?? value.label, "Leave");
    }

    return displayValue(value, "Leave");
  };

  return (
    <div className="my-requests-page">
      <div className="my-requests-header">
        <div>
          <p className="my-requests-eyebrow">LEAVE MANAGEMENT</p>
          <h1>My Leave Requests</h1>
          <p className="my-requests-subtitle">
            View and track the status of your leave applications.
          </p>
        </div>

        <button
          type="button"
          className="my-requests-refresh"
          onClick={fetchMyRequests}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="my-requests-summary">
        <div className="my-requests-stat">
          <span>Total Requests</span>
          <strong>{requests.length}</strong>
        </div>

        <div className="my-requests-stat">
          <span>Pending</span>
          <strong>
            {
              requests.filter(
                (request) =>
                  normalizeStatus(request.status) === "PENDING"
              ).length
            }
          </strong>
        </div>

        <div className="my-requests-stat">
          <span>Approved</span>
          <strong>
            {
              requests.filter(
                (request) =>
                  normalizeStatus(request.status) === "APPROVED"
              ).length
            }
          </strong>
        </div>

        <div className="my-requests-stat">
          <span>Rejected</span>
          <strong>
            {
              requests.filter(
                (request) =>
                  normalizeStatus(request.status) === "REJECTED"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="my-requests-content">
        {loading ? (
          <div className="my-requests-message">
            Loading your leave requests...
          </div>
        ) : error ? (
          <div className="my-requests-message my-requests-error">
            <p>{error}</p>
            <button
              type="button"
              className="my-requests-refresh"
              onClick={fetchMyRequests}
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="my-requests-empty">
            <div className="my-requests-empty-icon">📋</div>
            <h2>No Leave Requests Yet</h2>
            <p>
              Your submitted leave applications will appear here.
            </p>
          </div>
        ) : (
          <div className="my-requests-table-wrapper">
            <table className="my-requests-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request, index) => (
                  <tr
                    key={
                      request.id ??
                      request.leaveRequestId ??
                      index
                    }
                  >
                    <td>{getLeaveType(request)}</td>

                    <td>{formatDate(request.startDate)}</td>

                    <td>{formatDate(request.endDate)}</td>

                    <td>{getLeaveDays(request)}</td>

                    <td className="my-requests-reason">
                      {displayValue(request.reason)}
                    </td>

                    <td>
                      <span
                        className={`my-requests-status ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {normalizeStatus(request.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRequests;