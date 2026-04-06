import React from "react";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer">
      <div className="footer-back-top" onClick={scrollToTop} role="button" tabIndex={0}>
        Back to top
      </div>

      <div className="footer-main">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Get to Know Us</h4>
            <ul>
              <li><a href="#">About BuyHatke</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press Releases</a></li>
              <li><a href="#">AI Technology</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect with Us</h4>
            <ul>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Make Money with Us</h4>
            <ul>
              <li><a href="#">Sell on BuyHatke</a></li>
              <li><a href="#">Become an Affiliate</a></li>
              <li><a href="#">Advertise Products</a></li>
              <li><a href="#">Partner Programs</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Let Us Help You</h4>
            <ul>
              <li><a href="#">Your Account</a></li>
              <li><a href="#">Returns Centre</a></li>
              <li><a href="#">Shipping & Delivery</a></li>
              <li><a href="#">Help & FAQ</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-logo">
          Buy<span className="logo-accent">Hatke</span>
        </div>
        <div className="footer-copyright">
          © 2026 BuyHatke — AI Powered Recommendation System · Deep Learning Project
        </div>
      </div>
    </footer>
  );
}

export default Footer;
