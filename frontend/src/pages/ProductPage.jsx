/**
 * ProductPage — Full product detail page for BuyHatke.
 * Shows product info + multiple recommendation sections.
 * This is where ad clicks from PadHatke land.
 */
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import tracker from "../utils/tracker";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";

function ProductPage() {
  const { id } = useParams();
  const productId = parseInt(id, 10);
  const navigate = useNavigate();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [smartRecs, setSmartRecs] = useState(null);
  const [categoryRecs, setCategoryRecs] = useState(null);
  const [forYou, setForYou] = useState(null);
  const [loading, setLoading] = useState(true);
  const viewStart = useRef(Date.now());

  // Track view time
  useEffect(() => {
    viewStart.current = Date.now();
    tracker.setPlatform("buyhatke");
    if (token) tracker.setToken(token);
    tracker.trackClick("product", productId);

    return () => {
      const duration = Date.now() - viewStart.current;
      tracker.trackView("product", productId, duration);
    };
  }, [productId, token]);

  // Load product data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getProduct(productId),
      api.getSmartRecommendations(productId, token),
      api.getCategory(productId),
      api.getForYou(token),
      api.trackClick(productId),
    ])
      .then(([prod, smart, cat, fy]) => {
        setProduct(prod);
        setSmartRecs(smart?.recommendations);
        setCategoryRecs(cat?.category_recommendations);
        setForYou(fy?.recommendations);
      })
      .catch((err) => console.error("Load failed:", err))
      .finally(() => setLoading(false));
  }, [productId, token]);

  const handleProductClick = (newId) => {
    tracker.trackClick("product", newId);
    navigate(`/buyhatke/product/${newId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query) => {
    navigate(`/buyhatke?search=${encodeURIComponent(query)}`);
  };

  const getRating = (id) => (3.5 + ((id * 7 + 13) % 15) / 10).toFixed(1);
  const getReviewCount = (id) => ((id * 127 + 53) % 900) + 100;
  const formatPrice = (price) => Number(price).toLocaleString("en-IN");

  if (loading) {
    return (
      <div className="app buyhatke-app">
        <Header onSearch={handleSearch} />
        <div className="product-page-loading">
          <div className="loading-spinner"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product || product.error) {
    return (
      <div className="app buyhatke-app">
        <Header onSearch={handleSearch} />
        <div className="product-page-error">
          <h2>Product not found</h2>
          <button onClick={() => navigate("/buyhatke")}>← Back to BuyHatke</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app buyhatke-app">
      <Header onSearch={handleSearch} />

      {/* Breadcrumb */}
      <div className="product-breadcrumb">
        <a href="/buyhatke" onClick={(e) => { e.preventDefault(); navigate("/buyhatke"); }}>
          BuyHatke
        </a>
        <span>›</span>
        <span className="breadcrumb-category">{product.category}</span>
        <span>›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      {/* Product Detail */}
      <div className="product-detail-container">
        <div className="product-detail">
          <div className="product-detail-image">
            <img src={product.image} alt={product.name} />
          </div>

          <div className="product-detail-info">
            <span className="product-detail-category">{product.category}</span>
            <h1 className="product-detail-name">{product.name}</h1>

            <div className="product-detail-rating">
              <div className="product-detail-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`star ${i <= Math.floor(getRating(productId)) ? "filled" : ""}`}>★</span>
                ))}
              </div>
              <span className="product-detail-rating-text">
                {getRating(productId)} ({getReviewCount(productId).toLocaleString()} reviews)
              </span>
            </div>

            <div className="product-detail-price">
              <span className="product-detail-price-label">Price:</span>
              <span className="product-detail-price-value">₹{formatPrice(product.price)}</span>
              <span className="product-detail-price-original">
                ₹{formatPrice(Math.round(product.price * 1.3))}
              </span>
              <span className="product-detail-discount">23% off</span>
            </div>

            {product.description && (
              <div className="product-detail-desc">
                <h3>About this item</h3>
                <p>{product.description}</p>
              </div>
            )}

            <div className="product-detail-actions">
              <button className="product-add-cart-btn">🛒 Add to Cart</button>
              <button className="product-buy-now-btn">⚡ Buy Now</button>
            </div>

            <div className="product-detail-delivery">
              <div className="delivery-item">
                <span className="delivery-icon">🚚</span>
                <span>Free delivery by Tomorrow</span>
              </div>
              <div className="delivery-item">
                <span className="delivery-icon">↩️</span>
                <span>10 days return policy</span>
              </div>
              <div className="delivery-item">
                <span className="delivery-icon">💰</span>
                <span>Cash on delivery available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations (Hybrid) */}
      {smartRecs && smartRecs.items && smartRecs.items.length > 0 && (
        <section className="product-rec-section">
          <div className="product-rec-header">
            <h2>🧠 Smart Recommendations</h2>
            <p className="rec-subtitle">
              Powered by AI: Content similarity ({(smartRecs.weights?.content * 100) || 40}%)
              + Collaborative ({(smartRecs.weights?.collaborative * 100) || 30}%)
              + Your behavior ({(smartRecs.weights?.behavior * 100) || 20}%)
              + Trending ({(smartRecs.weights?.popularity * 100) || 10}%)
            </p>
          </div>
          <div className="product-rec-grid">
            {smartRecs.items.slice(0, 6).map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onClick={handleProductClick}
                badge="AI Pick"
                badgeClass="ai-badge"
                reason={item.reason}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category Recommendations */}
      {categoryRecs && categoryRecs.items && categoryRecs.items.length > 0 && (
        <section className="product-rec-section">
          <div className="product-rec-header">
            <h2>📦 More in {categoryRecs.based_on_category}</h2>
          </div>
          <div className="product-rec-grid">
            {categoryRecs.items.slice(0, 6).map((item) => (
              <ProductCard key={item.id} product={item} onClick={handleProductClick} />
            ))}
          </div>
        </section>
      )}

      {/* For You */}
      {forYou && forYou.items && forYou.items.length > 0 && (
        <section className="product-rec-section">
          <div className="product-rec-header">
            <h2>✨ Recommended For You</h2>
            <p className="rec-subtitle">Based on your browsing patterns and preferences</p>
          </div>
          <div className="product-rec-grid">
            {forYou.items.slice(0, 6).map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onClick={handleProductClick}
                reason={item.reason}
              />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

export default ProductPage;
