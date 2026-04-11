/**
 * BuyHatkeHome — The e-commerce homepage (refactored from original App.jsx).
 * Amazon-style product browsing with search, categories, trending, and recommendations.
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import SubNav from "../components/SubNav";
import HeroBanner from "../components/HeroBanner";
import CategoryGrid from "../components/CategoryGrid";
import TrendingSection from "../components/TrendingSection";
import PickUpSection from "../components/PickUpSection";
import RecommendedSection from "../components/RecommendedSection";
import AIRecommendations from "../components/AIRecommendations";
import DealsBanner from "../components/DealsBanner";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import api from "../utils/api";
import tracker from "../utils/tracker";

function BuyHatkeHome() {
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Set tracker platform
  useEffect(() => {
    tracker.setPlatform("buyhatke");
    if (token) tracker.setToken(token);
  }, [token]);

  const handleProductClick = async (id) => {
    setSelectedProductId(id);
    tracker.trackClick("product", id);
    try {
      await api.trackClick(id);
    } catch (err) {
      console.error("Track click failed:", err);
    }
    // Navigate to product page
    navigate(`/buyhatke/product/${id}`);
  };

  const handleSearch = async (query) => {
    if (!query || !query.trim()) {
      setShowSearch(false);
      setSearchResults([]);
      setSearchQuery("");
      return;
    }
    setSearchQuery(query);
    setShowSearch(true);
    try {
      const data = await api.search(query);
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="app buyhatke-app">
      <Header onSearch={handleSearch} />
      <SubNav />

      {showSearch ? (
        <section className="search-results-section fade-in-up">
          <div className="search-results-header">
            <h2>
              Results for: <span>&quot;{searchQuery}&quot;</span>
              {searchResults.length > 0 && ` (${searchResults.length} items)`}
            </h2>
            <button className="back-btn" onClick={clearSearch}>
              ← Back to Home
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="search-results-grid">
              {searchResults.map((p) => (
                <ProductCard key={p.id} product={p} onClick={handleProductClick} />
              ))}
            </div>
          ) : (
            <div className="empty-section">
              <div className="empty-icon">🔍</div>
              <p>No results found for &quot;{searchQuery}&quot;. Try a different search.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <HeroBanner />
          <CategoryGrid />
        </>
      )}

      <main className="main-content">
        <TrendingSection onProductClick={handleProductClick} />
        <PickUpSection onProductClick={handleProductClick} />
        <DealsBanner />

        <div id="recommendations">
          <RecommendedSection
            productId={selectedProductId}
            onProductClick={handleProductClick}
          />
          <AIRecommendations
            productId={selectedProductId}
            onProductClick={handleProductClick}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BuyHatkeHome;
