/**
 * AuthForm — Login/Signup form with glassmorphism design.
 * Shared across both platforms.
 */
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("deeplearning");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("deeplearning@123");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        if (!email) {
          setError("Email is required");
          setLoading(false);
          return;
        }
        await signup(username, email, password, displayName || username);
      }
      navigate("/padhatke");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-card">
        <div className="auth-logo">
          <span className="auth-logo-pad">Pad</span>
          <span className="auth-logo-hatke">Hatke</span>
          <span className="auth-logo-divider">×</span>
          <span className="auth-logo-buy">Buy</span>
          <span className="auth-logo-hatke">Hatke</span>
        </div>

        <h2 className="auth-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? "Sign in to access both platforms"
            : "One account for both PadHatke & BuyHatke"}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              minLength={1}
            />
          </div>

          {!isLogin && (
            <>
              <div className="auth-field">
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="auth-displayname">Display Name</label>
                <input
                  id="auth-displayname"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How others see you"
                />
              </div>
            </>
          )}

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={1}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-spinner"></span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="auth-switch-btn"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>

        <div className="auth-demo-credentials">
          <p>Demo: <strong>deeplearning</strong> / <strong>deeplearning@123</strong></p>
        </div>
      </div>
    </div>
  );
}

export default AuthForm;
