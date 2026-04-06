import React from "react";

function getRating(id) {
  return 3.5 + ((id * 7 + 13) % 15) / 10;
}

function getReviewCount(id) {
  return ((id * 127 + 53) % 900) + 100;
}

function StarRating({ rating }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`star ${i <= Math.floor(rating) ? "filled" : i - 0.5 <= rating ? "half" : ""}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product, onClick, badge, badgeClass, reason }) {
  const rating = getRating(product.id);
  const reviewCount = getReviewCount(product.id);

  const formatPrice = (price) => {
    return Number(price).toLocaleString("en-IN");
  };

  return (
    <div className="product-card" onClick={() => onClick && onClick(product.id)} role="button" tabIndex={0}>
      <div className="product-card-image">
        {badge && (
          <span className={`product-card-badge ${badgeClass || ""}`}>{badge}</span>
        )}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      <div className="product-card-info">
        <div className="product-card-category">{product.category}</div>
        <div className="product-card-name">{product.name}</div>

        <div className="product-card-rating">
          <StarRating rating={rating} />
          <span className="rating-count">({reviewCount})</span>
        </div>

        <div className="product-card-price">
          <span className="price-symbol">₹</span>
          <span className="price-value">{formatPrice(product.price)}</span>
        </div>

        {reason && (
          <div className="product-card-reason">
            🤖 {reason}
          </div>
        )}

        <button
          className="add-to-cart-btn"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
