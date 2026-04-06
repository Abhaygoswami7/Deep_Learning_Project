import React, { useState } from "react";
import Header from "./components/Header";
import SubNav from "./components/SubNav";
import HeroBanner from "./components/HeroBanner";
import CategoryGrid from "./components/CategoryGrid";
import TrendingSection from "./components/TrendingSection";
import PickUpSection from "./components/PickUpSection";
import RecommendedSection from "./components/RecommendedSection";
import AIRecommendations from "./components/AIRecommendations";
import DealsBanner from "./components/DealsBanner";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import api from "./utils/api";

function App() {
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleProductClick = async (id) => {
    setSelectedProductId(id);
    try {
      await api.trackClick(id);
    } catch (err) {
      console.error("Track click failed:", err);
    }
    setTimeout(() => {
      document.getElementById("recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
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
    <div className="app">
      <Header onSearch={handleSearch} />
      <SubNav />

      {showSearch ? (
        <section className="search-results-section fade-in-up">
          <div className="search-results-header">
            <h2>
              Results for: <span>&quot;{searchQuery}&quot;</span>
              {searchResults.length > 0 && ` (${searchResults.length} items)`}
            </h2>
            <button className="back-btn" onClick={clearSearch}>← Back to Home</button>
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
          <RecommendedSection productId={selectedProductId} onProductClick={handleProductClick} />
          <AIRecommendations productId={selectedProductId} onProductClick={handleProductClick} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;