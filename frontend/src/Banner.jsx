import React, { useState, useEffect } from "react";

const images = [
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
  "/6.png"
];

function Banner() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="banner">
      <div className="nav-btn left" onClick={prevSlide}>❮</div>

      <div
        className="slider"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <img key={i} src={img} alt="" />
        ))}
      </div>

      <div className="nav-btn right" onClick={nextSlide}>❯</div>
    </div>
  );
}

export default Banner;