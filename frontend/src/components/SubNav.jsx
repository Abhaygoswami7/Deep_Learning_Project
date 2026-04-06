import React from "react";

const categories = [
  { label: "All", icon: "☰", isAll: true },
  { label: "Today's Deals" },
  { label: "Electronics" },
  { label: "Fashion" },
  { label: "Home & Kitchen" },
  { label: "Beauty" },
  { label: "Books" },
  { label: "Toys" },
  { label: "Fitness" },
  { label: "Groceries" },
  { label: "Accessories" },
];

function SubNav() {
  return (
    <nav className="sub-nav">
      <div className="sub-nav-inner">
        {categories.map((cat) => (
          <a
            href="#"
            key={cat.label}
            className={`sub-nav-item ${cat.isAll ? "all-menu" : ""}`}
            onClick={(e) => e.preventDefault()}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default SubNav;
