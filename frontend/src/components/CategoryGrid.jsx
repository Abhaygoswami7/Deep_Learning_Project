import React from "react";

const categories = [
  {
    name: "Electronics",
    items: [
      { label: "Smartphones", img: "https://m.media-amazon.com/images/I/71d7rfSl0wL._SX679_.jpg" },
      { label: "Laptops", img: "https://m.media-amazon.com/images/I/71jG+e7roXL._SX679_.jpg" },
      { label: "Headphones", img: "https://m.media-amazon.com/images/I/71o8Q5XJS5L._SX679_.jpg" },
      { label: "Cameras", img: "https://m.media-amazon.com/images/I/914hFeTU2-L._SX679_.jpg" },
    ],
  },
  {
    name: "Fashion",
    items: [
      { label: "Men's Wear", img: "https://m.media-amazon.com/images/I/61-jBuhtgZL._UX679_.jpg" },
      { label: "Women's Wear", img: "https://m.media-amazon.com/images/I/71Q1tRzJ-PL._UY879_.jpg" },
      { label: "Footwear", img: "https://m.media-amazon.com/images/I/71z1+2Y+WML._UX679_.jpg" },
      { label: "Accessories", img: "https://m.media-amazon.com/images/I/61r6k2K9QEL._SX679_.jpg" },
    ],
  },
  {
    name: "Home & Kitchen",
    items: [
      { label: "Cookware", img: "https://m.media-amazon.com/images/I/61vQhV6i2yL._SX679_.jpg" },
      { label: "Kitchen", img: "https://m.media-amazon.com/images/I/61dLZ0cH1RL._SX679_.jpg" },
      { label: "Storage", img: "https://m.media-amazon.com/images/I/71r3n6V4RGL._SX679_.jpg" },
      { label: "Decor", img: "https://m.media-amazon.com/images/I/61f1e8W1G7L._SX679_.jpg" },
    ],
  },
  {
    name: "Books & Learning",
    items: [
      { label: "Self-Help", img: "https://m.media-amazon.com/images/I/81bGKUa1e0L._SX679_.jpg" },
      { label: "Finance", img: "https://m.media-amazon.com/images/I/81bsw6fnUiL._SX679_.jpg" },
      { label: "Fiction", img: "https://m.media-amazon.com/images/I/71aFt4+OTOL._SX679_.jpg" },
      { label: "Productivity", img: "https://m.media-amazon.com/images/I/71QKQ9mwV7L._SX679_.jpg" },
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
