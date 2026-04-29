import React from "react";

const categories = [
  {
    name: "Electronics",
    items: [
      { label: "Smartphones", img: "/images/products/1.png" },
      { label: "Laptops", img: "/images/products/4.png" },
      { label: "Headphones", img: "/images/products/6.png" },
      { label: "Cameras", img: "/images/products/10.png" },
    ],
  },
  {
    name: "Fashion",
    items: [
      { label: "Men's Wear", img: "/images/products/11.png" },
      { label: "Women's Wear", img: "/images/products/16.png" },
      { label: "Footwear", img: "/images/products/41.png" },
      { label: "Accessories", img: "/images/products/51.png" },
    ],
  },
  {
    name: "Home & Kitchen",
    items: [
      { label: "Cookware", img: "/images/products/21.png" },
      { label: "Kitchen", img: "/images/products/23.png" },
      { label: "Storage", img: "/images/products/28.png" },
      { label: "Decor", img: "/images/products/30.png" },
    ],
  },
  {
    name: "Books & Learning",
    items: [
      { label: "Self-Help", img: "/images/products/71.png" },
      { label: "Finance", img: "/images/products/72.png" },
      { label: "Fiction", img: "/images/products/74.png" },
      { label: "Productivity", img: "/images/products/76.png" },
    ],
  },
];

function CategoryGrid() {
  return (
    <section className="category-grid-section">
      <div className="category-grid">
        {categories.map((cat) => (
          <div key={cat.name} className="category-card">
            <h3>{cat.name}</h3>
            <div className="category-card-grid">
              {cat.items.map((item) => (
                <div key={item.label}>
                  <div className="category-card-img">
                    <img src={item.img} alt={item.label} loading="lazy" />
                  </div>
                  <div className="category-card-label">{item.label}</div>
                </div>
              ))}
            </div>
            <a href="#" className="see-more" onClick={(e) => e.preventDefault()}>
              See more →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
