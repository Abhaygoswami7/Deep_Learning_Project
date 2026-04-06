import React, { useEffect, useState } from "react";
import ProductRow from "./ProductRow";
import api from "../utils/api";

function PickUpSection({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPersonalized()
      .then((data) => {
        const recs = data?.recommendations;
        if (recs && recs.items) {
          setProducts(recs.items);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching personalized:", err);
        setLoading(false);
      });
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <div className="section-bg">
      <ProductRow
        title="📦 Pick Up Where You Left Off"
        products={products}
        onProductClick={onProductClick}
        loading={loading}
        linkText="Your browsing history"
      />
    </div>
  );
}

export default PickUpSection;
