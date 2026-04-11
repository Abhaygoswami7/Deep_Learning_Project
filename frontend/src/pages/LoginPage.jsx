import React from "react";
import AuthForm from "../components/AuthForm";
import "../styles/login.css";

function LoginPage() {
  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">
        <img src="/logo1.jpg" alt="logo" className="login-logo" />
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <h1 className="login-title">BuyHatke</h1>
        <p className="login-subtitle">Join today.</p>

        <AuthForm />
      </div>

    </div>
  );
}

export default LoginPage;