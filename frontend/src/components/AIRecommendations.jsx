import React, { useEffect, useState } from "react";
import ProductRow from "./ProductRow";
import api from "../utils/api";

function AIRecommendations({ productId, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api.getHybrid(productId)
      .then((data) => {
        const recs = data?.hybrid_recommendations;
        if (recs && recs.items) {
          setProducts(recs.items);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching hybrid:", err);
        setLoading(false);
      });
  }, [productId]);

  return (
    <div className="section-bg">
      <ProductRow
        title="🤖 AI-Powered Recommendations"
        products={products}
        onProductClick={onProductClick}
        loading={loading}
        badge="AI Pick"
        badgeClass="ai-badge"
        showReason={true}
        linkText="How this works"
      />
    </div>
  );
}

export default AIRecommendations;
