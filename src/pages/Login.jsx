
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        null,
        {
          params: {
            username: username.trim(),
            password,
          },
        }
      );

      const { token, username: loggedInUsername, role } = response.data;

      const normalizedRole = String(role || "")
        .replace(/^ROLE_/i, "")
        .toUpperCase();

      if (!token || !normalizedRole) {
        throw new Error("The server returned an incomplete login response.");
      }

      const destinations = {
        EMPLOYEE: "/dashboard",
        MANAGER: "/manager-dashboard",
        ADMIN: "/admin-dashboard",
      };

      const destination = destinations[normalizedRole];

      if (!destination) {
        throw new Error("Your account role is not recognized.");
      }

      // Clear previous login details from both storage locations.
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("role");

      // Save the session according to the Remember me checkbox.
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("token", token);
      storage.setItem("username", loggedInUsername || username.trim());
      storage.setItem("role", normalizedRole);

      // Navigate to the dashboard matching the authenticated role.
      navigate(destination, { replace: true });
    } catch (err) {
      const responseData = err.response?.data;

      const serverMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message;

      setError(
        serverMessage ||
          err.message ||
          "Login failed. Check your credentials and backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-left">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">CL</div>
          <span>Leave<span>Flow</span></span>
        </div>

        <div className="welcome">
          <p className="small-title">EMPLOYEE MANAGEMENT PORTAL</p>
          <h1>Your workday,<br /><span>simplified.</span></h1>
          <p className="description">
            Manage your time off with confidence. Apply for leave, track your
            remaining balance, and stay updated in one simple workspace.
          </p>

          <div className="features">
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">✓</div>
              <div>
                <strong>Easy leave applications</strong>
                <p>Submit and manage requests in a few steps.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">◷</div>
              <div>
                <strong>Real-time leave balance</strong>
                <p>Keep track of available and used leave days.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">↗</div>
              <div>
                <strong>Clear request status</strong>
                <p>See whether your applications are pending or approved.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="login-trust">
            <span className="trust-dot" />
            Secure access for authorized employees
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} LeaveFlow · Employee Leave Management
          </div>
        </div>
      </section>

      <section className="login-right">
        <div
          className="login-decoration login-decoration-one"
          aria-hidden="true"
        />
        <div
          className="login-decoration login-decoration-two"
          aria-hidden="true"
        />

        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand">
              <div className="brand-icon" aria-hidden="true">CL</div>
              <span>Leave<span>Flow</span></span>
            </div>
          </div>

          <div className="login-card-icon" aria-hidden="true">↗</div>

          <div className="login-heading">
            <p>WELCOME BACK</p>
            <h2>Sign in to your account</h2>
            <span>
              Enter your credentials to access your employee workspace.
            </span>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="login-error-icon">!</span>
              <p>{String(error)}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <div className="input-box">
                <span className="input-icon" aria-hidden="true">♙</span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-box">
                <span className="input-icon" aria-hidden="true">▣</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  className="show-btn"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                Remember me
              </label>
              <span>Secure employee access</span>
            </div>

            <button className="login-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to workspace
                  <span className="login-button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <p>EMPLOYEE LEAVE MANAGEMENT</p>
            <span />
          </div>

          <div className="secure-login">
            <span className="secure-icon">✓</span>
            Your account is protected by secure authentication.
          </div>
        </div>

        <p className="login-bottom-text">
          Designed for better work-life balance <span>•</span> LeaveFlow
        </p>
      </section>
    </main>
  );
}

export default Login;
