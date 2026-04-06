import React, { useState, useEffect } from "react";

const bannerSlides = [
  { text: "🔥 Great Indian Sale — Up to 70% Off Electronics", gradient: 0 },
  { text: "👗 Fashion Fest — Deals Starting ₹299", gradient: 1 },
  { text: "🏠 Home Makeover Sale — Flat 50% Off", gradient: 2 },
  { text: "📚 Books & Learning — Buy 2 Get 1 Free", gradient: 3 },
  { text: "💪 Fitness Essentials — Starting ₹199", gradient: 4 },
];

function HeroBanner() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev + 1) % bannerSlides.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-banner">
      <div className="hero-slider" style={{ transform: `translateX(-${index * 100}%)` }}>
        {bannerSlides.map((slide, i) => (
          <div key={i} className="hero-slide-placeholder">
            <div style={{ textAlign: "center", padding: "0 40px", maxWidth: 700 }}>
              <div style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>
                {slide.text}
              </div>
              <div style={{ fontSize: "1rem", opacity: 0.8 }}>Shop now on BuyHatke</div>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-fade" />

      <button className="hero-nav-btn left" onClick={prevSlide} aria-label="Previous slide">❮</button>
      <button className="hero-nav-btn right" onClick={nextSlide} aria-label="Next slide">❯</button>
    </div>
  );
}

export default HeroBanner;
