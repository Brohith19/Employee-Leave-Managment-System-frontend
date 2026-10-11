
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ApplyLeave.css";

function getStoredValue(key) {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
}

function ApplyLeave() {
  const navigate = useNavigate();
  const username = getStoredValue("username");

  const [form, setForm] = useState({
    leaveTypeId: "1",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const calculateDays = () => {
    if (
      !form.startDate ||
      !form.endDate ||
      form.endDate < form.startDate
    ) {
      return 0;
    }

    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);

    return Math.floor((end - start) / 86400000) + 1;
  };

  const requestedDays = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!username) {
      setErrorMessage("Your session has expired. Please log in again.");
      return;
    }

    if (
      !form.startDate ||
      !form.endDate ||
      !form.reason.trim() ||
      !form.leaveTypeId
    ) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (form.endDate < form.startDate) {
      setErrorMessage("End date cannot be earlier than start date.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      // Resolve the employee linked to the signed-in username.
      const employeeResponse = await api.get(
        `/api/employees/username/${encodeURIComponent(username)}`
      );

      const employeeId = employeeResponse.data?.id;

      if (!employeeId) {
        throw new Error(
          "Employee record not found for this account."
        );
      }

      // Preserve the existing API endpoint and parameter names.
      const params = new URLSearchParams({
        employeeId: String(employeeId),
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });

      await api.post(`/api/leave-requests?${params.toString()}`);

      setSuccessMessage("Leave request submitted successfully!");

      setForm({
        leaveTypeId: "1",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (error) {
      console.error("Leave submission failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      const status = error.response?.status;
      const responseData = error.response?.data;

      let message =
        typeof responseData === "string" && responseData.trim()
          ? responseData
          : responseData?.message ||
            responseData?.error ||
            "";

      if (!error.response) {
        message =
          "Cannot connect to the backend. Check that Spring Boot is running on port 8080.";
      } else if (status === 401) {
        message = "Your login session is invalid. Please sign in again.";
      } else if (status === 403) {
        message =
          "The backend denied this request. Check your employee permissions.";
      } else if (status === 404) {
        message =
          "An API endpoint was not found. Check the employee lookup and leave request controller URLs.";
      } else if (status === 400 && !message) {
        message =
          "The backend rejected the leave details. Check the dates, leave type, and required parameters.";
      } else if (!message) {
        message = `Leave submission failed (HTTP ${status || "unknown"}). Check the backend logs.`;
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-leave-page">
      <header className="apply-leave-header">
        <div>
          <p className="apply-eyebrow">EMPLOYEE PORTAL / TIME OFF</p>
          <h1>Apply for Leave</h1>
          <p className="apply-subtitle">
            Submit a leave request and keep track of your time away.
          </p>
        </div>

        <div className="apply-header-badge">
          <span className="apply-header-icon">✦</span>
          <div>
            <strong>Leave Center</strong>
            <span>Request management</span>
          </div>
        </div>
      </header>

      <div className="apply-leave-layout">
        <main className="apply-form-card">
          <div className="apply-card-heading">
            <div className="apply-heading-icon">✎</div>
            <div>
              <h2>Leave application</h2>
              <p>Complete the details below to submit your request.</p>
            </div>
          </div>

          <div className="apply-divider" />

          <form onSubmit={handleSubmit} className="apply-leave-form">
            {errorMessage && (
              <div className="apply-error-message" role="alert">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="apply-success-message" role="status">
                {successMessage}
                <button
                  type="button"
                  onClick={() => navigate("/my-requests")}
                >
                  View my requests
                </button>
              </div>
            )}

            <div className="apply-field">
              <label htmlFor="leaveTypeId">Leave type</label>
              <select
                id="leaveTypeId"
                name="leaveTypeId"
                value={form.leaveTypeId}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="1">Casual Leave</option>
              </select>
              <span className="apply-field-hint">
                Choose the leave category for your request.
              </span>
            </div>

            <div className="apply-date-grid">
              <div className="apply-field">
                <label htmlFor="startDate">Start date</label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="apply-field">
                <label htmlFor="endDate">End date</label>
                <input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  min={
                    form.startDate ||
                    new Date().toLocaleDateString("en-CA")
                  }
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="apply-field">
              <div className="apply-label-row">
                <label htmlFor="reason">Reason for leave</label>
                <span>Required</span>
              </div>

              <textarea
                id="reason"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Briefly explain why you need leave..."
                rows={5}
                maxLength={1000}
                required
                disabled={loading}
              />

              <div className="apply-character-count">
                {form.reason.length}/1000 characters
              </div>
            </div>

            <div className="apply-form-footer">
              <p>
                <span>ⓘ</span> Please verify your dates before submitting.
              </p>

              <button
                className="apply-submit-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit request"}
                {!loading && <span> →</span>}
              </button>
            </div>
          </form>
        </main>

        <aside className="apply-side-column">
          <section className="apply-summary-card">
            <p className="apply-side-eyebrow">REQUEST SUMMARY</p>
            <h2>Your time off</h2>
            <p className="apply-summary-description">
              Review the duration of your selected leave dates.
            </p>

            <div className="apply-days-display">
              <strong>{requestedDays}</strong>
              <span>
                {requestedDays === 1 ? "day requested" : "days requested"}
              </span>
            </div>

            <div className="apply-summary-row">
              <span>Leave type</span>
              <strong>Casual Leave</strong>
            </div>

            <div className="apply-summary-row">
              <span>Start date</span>
              <strong>{form.startDate || "Not selected"}</strong>
            </div>

            <div className="apply-summary-row">
              <span>End date</span>
              <strong>{form.endDate || "Not selected"}</strong>
            </div>
          </section>

          <section className="apply-tip-card">
            <div className="apply-tip-icon">✦</div>
            <h3>Before you submit</h3>
            <ul>
              <li>Choose the correct start and end dates.</li>
              <li>Provide a clear reason for your leave.</li>
              <li>Your request must be reviewed by your manager.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ApplyLeave;
