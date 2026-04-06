import React, { useEffect, useState } from "react";
import ProductRow from "./ProductRow";
import api from "../utils/api";

function TrendingSection({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrending()
      .then((data) => {
        setProducts(data.trending || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching trending:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="section-bg">
      <ProductRow
        title="🔥 Trending Products"
        products={products}
        onProductClick={onProductClick}
        loading={loading}
        badge="Trending"
        badgeClass="trending-badge"
        linkText="See all deals"
      />
    </div>
  );
}

export default TrendingSection;
