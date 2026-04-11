/**
 * App — Root component with route-based layout.
 * Routes: /, /login, /padhatke, /buyhatke, /buyhatke/product/:id
 */

import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import tracker from "./utils/tracker";

import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import PadHatkeFeed from "./pages/PadHatkeFeed";
import BuyHatkeHome from "./pages/BuyHatkeHome";
import ProductPage from "./pages/ProductPage";

function App() {
  const { token, loading } = useAuth();

  // Initialize tracker
  useEffect(() => {
    tracker.init("buyhatke", token);
    return () => tracker.stop();
  }, []);

  // Update tracker token
  useEffect(() => {
    tracker.setToken(token);
  }, [token]);

  // Loading screen
  if (loading) {
    return (
      <div className="loading-fullpage">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Routes>

      {/* LOGIN PAGE */}
      <Route
        path="/login"
        element={token ? <Navigate to="/padhatke" replace /> : <LoginPage />}
      />

      {/* PADHATKE (Protected) */}
      <Route
        path="/padhatke"
        element={
          token ? (
            <AppShell>
              <PadHatkeFeed />
            </AppShell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* BUYHATKE */}
      <Route
        path="/buyhatke"
        element={
          <AppShell>
            <BuyHatkeHome />
          </AppShell>
        }
      />

      {/* PRODUCT PAGE */}
      <Route
        path="/buyhatke/product/:id"
        element={
          <AppShell>
            <ProductPage />
          </AppShell>
        }
      />

      {/* DEFAULT REDIRECT */}
      <Route path="/" element={<Navigate to="/padhatke" replace />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/padhatke" replace />} />

    </Routes>
  );
}

export default App;