import React, { useEffect, useState } from "react";

function Products() {
  const [products, setProducts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH PRODUCTS
  useEffect(() => {
    fetch("http://127.0.0.1:8000/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  // 🔥 HANDLE CLICK
  const handleClick = async (id) => {
    try {
      // 1. Track click
      await fetch(`http://127.0.0.1:8000/track_click/${id}`, {
        method: "POST",
      });

      // 2. Get recommendations
      const res = await fetch(
        `http://127.0.0.1:8000/recommend/${id}`
      );
      const data = await res.json();

      setRecommended(data.recommendations);

      console.log("Recommendations loaded");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      {/* 🔹 PRODUCTS */}
      <div className="products">
        {loading ? (
          <h2 style={{ padding: "20px" }}>Loading...</h2>
        ) : (
          products.slice(0, 4).map((p) => (
            <div
              className="card"
              key={p.id}
              onClick={() => handleClick(p.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="card-content">
                <div className="title">{p.name}</div>

                <div className="grid">
                  <div className="box">
                    <img src={p.image} alt={p.name} />
                  </div>
                  <div className="box">
                    <img src={p.image} alt={p.name} />
                  </div>
                  <div className="box">
                    <img src={p.image} alt={p.name} />
                  </div>
                  <div className="box">
                    <img src={p.image} alt={p.name} />
                  </div>
                </div>
              </div>

              <div className="footer">₹ {p.price}</div>
            </div>
          ))
        )}
      </div>

      {/* 🔥 RECOMMENDATION SECTION */}
      {recommended.length > 0 && (
        <>
          <h2 style={{ padding: "20px" }}>
            🎯 Recommended for you
          </h2>

          <div className="products">
            {recommended.map((p) => (
              <div className="card" key={p.id}>
                <div className="box">
                  <img src={p.image} alt={p.name} />
                </div>

                <div style={{ marginTop: "10px" }}>{p.name}</div>

                <div style={{ fontWeight: "bold" }}>
                  ₹{p.price}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default Products;