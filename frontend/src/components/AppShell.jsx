/**
 * AppShell — Platform switcher and top navigation.
 * Shared chrome for both PadHatke and BuyHatke.
 */
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isPadHatke = location.pathname.startsWith("/padhatke");
  const isBuyHatke = location.pathname.startsWith("/buyhatke");

  return (
    <div className="app-shell">
      {/* Platform Switcher Bar */}
      <div className="platform-switcher">
        <div className="platform-switcher-inner">
          <div className="platform-tabs">
            <button
              className={`platform-tab ${isPadHatke ? "active" : ""}`}
              onClick={() => navigate("/padhatke")}
              id="tab-padhatke"
            >
              <span className="platform-tab-icon"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640h-80v280l-100-60-100 60v-280H240v640Zm0 0v-640 640Zm200-360 100-60 100 60-100-60-100 60Z"/></svg></span>
              <span className="platform-tab-name">
                Pad<strong>Hatke</strong>
              </span>
            </button>
            <button
              className={`platform-tab ${isBuyHatke ? "active buyhatke" : ""}`}
              onClick={() => navigate("/buyhatke")}
              id="tab-buyhatke"
            >
              <span className="platform-tab-icon"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z"/></svg></span>
              <span className="platform-tab-name">
                Buy<strong>Hatke</strong>
              </span>
            </button>
          </div>

          <div className="platform-user">
            {user ? (
              <div className="platform-user-info">
                <div className="platform-avatar">
                  {(user.display_name || user.username || "U").charAt(0).toUpperCase()}
                </div>
                <span className="platform-username">{user.display_name || user.username}</span>
                <button className="platform-logout-btn" onClick={logout} title="Logout">
                  ↗
                </button>
              </div>
            ) : (
              <button className="platform-login-btn" onClick={() => navigate("/login")}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}

export default AppShell;
