import React, { useState } from "react";

function Header({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit(e);
  };

  return (
    <header className="site-header">
      <div className="header-main">
        <a href="/" className="header-logo" onClick={(e) => { e.preventDefault(); onSearch(""); setQuery(""); }}>
          Buy<span className="logo-accent">Hatke</span>
        </a>

        <div className="header-deliver">
          <span>Delivering to India</span>
          <span className="deliver-to">📍 Update location</span>
        </div>

        <form className="header-search" onSubmit={handleSubmit}>
          <select className="search-category" id="search-category-select">
            <option>All</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Home &amp; Kitchen</option>
            <option>Beauty</option>
            <option>Books</option>
          </select>
          <input
            id="search-input"
            className="search-input"
            type="text"
            placeholder="Search BuyHatke"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="search-btn" aria-label="Search">🔍</button>
        </form>

        <nav className="header-nav">
          <a href="#" className="header-nav-item" id="nav-account">
            <span className="nav-line-1">Hello, sign in</span>
            <span className="nav-line-2">Account &amp; Lists</span>
          </a>
          <a href="#" className="header-nav-item" id="nav-orders">
            <span className="nav-line-1">Returns</span>
            <span className="nav-line-2">&amp; Orders</span>
          </a>
          <a href="#" className="header-cart" id="nav-cart">
            <span className="cart-count">0</span>
            <span className="cart-icon">🛒</span>
            <span className="cart-text">Cart</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
