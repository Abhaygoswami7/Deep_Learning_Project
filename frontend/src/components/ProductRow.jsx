import React, { useRef } from "react";
import ProductCard from "./ProductCard";

function SkeletonRow() {
  return (
    <div className="loading-row">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-text medium" />
          <div className="skeleton-text short" />
          <div className="skeleton-text short" />
        </div>
      ))}
    </div>
  );
}

function ProductRow({ title, products, onProductClick, loading, badge, badgeClass, showReason, linkText }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction * 460, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="product-row-section">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
        </div>
        <SkeletonRow />
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="product-row-section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {linkText && <a href="#" className="section-link" onClick={(e) => e.preventDefault()}>{linkText}</a>}
      </div>

      <div className="product-row-container">
        <button className="scroll-btn scroll-left" onClick={() => scroll(-1)} aria-label="Scroll left">
          ‹
        </button>

        <div className="product-row" ref={scrollRef}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClick={onProductClick}
              badge={badge}
              badgeClass={badgeClass}
              reason={showReason ? p.reason : undefined}
            />
          ))}
        </div>

        <button className="scroll-btn scroll-right" onClick={() => scroll(1)} aria-label="Scroll right">
          ›
        </button>
      </div>
    </section>
  );
}

export default ProductRow;
