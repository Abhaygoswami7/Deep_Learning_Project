import React, { useEffect, useState } from "react";
import ProductRow from "./ProductRow";
import api from "../utils/api";

function RecommendedSection({ productId, onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [basedOn, setBasedOn] = useState("");

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api.getRecommendations(productId)
      .then((data) => {
        const recs = data?.recommendations;
        if (recs && recs.items) {
          setProducts(recs.items);
          setBasedOn(recs.based_on || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recommendations:", err);
        setLoading(false);
      });
  }, [productId]);

  const title = basedOn
    ? `⭐ Recommended for you · Based on "${basedOn}"`
    : "⭐ Recommended for You";

  return (
    <div className="section-bg">
      <ProductRow
        title={title}
        products={products}
        onProductClick={onProductClick}
        loading={loading}
        linkText="See more recommendations"
      />
    </div>
  );
}

export default RecommendedSection;
