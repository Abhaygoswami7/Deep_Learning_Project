/**
 * PadHatkeFeed — Twitter/X-style social feed with embedded ads.
 * UI upgraded to match modern X.com layout (no data changes)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import tracker from "../utils/tracker";
import PostCard from "../components/PostCard";
import AdCard from "../components/AdCard";
import ComposePost from "../components/ComposePost";
import "../styles/padhatke.css";

function PadHatkeFeed() {
  const [feedItems, setFeedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const { user, token } = useAuth();
  const observerRef = useRef(null);

  useEffect(() => {
    tracker.setPlatform("padhatke");
    if (token) tracker.setToken(token);
  }, [token]);

  const loadFeed = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const data = await api.getFeed(pageNum, token);
      if (data.feed) {
        if (append) {
          setFeedItems((prev) => [...prev, ...data.feed]);
        } else {
          setFeedItems(data.feed);
        }
        setHasMore(data.has_more);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeed(1);

    setTrendingTopics([
      { tag: "#TechReview", posts: "2.4K", category: "Technology" },
      { tag: "#ReadingList", posts: "1.8K", category: "Books" },
      { tag: "#FitnessGoals", posts: "3.1K", category: "Fitness" },
      { tag: "#OOTD", posts: "5.2K", category: "Fashion" },
      { tag: "#HomeChef", posts: "1.5K", category: "Food" },
      { tag: "#BuyHatke", posts: "890", category: "Shopping" },
      { tag: "#GadgetDeal", posts: "2.1K", category: "Deals" },
      { tag: "#SkinCare", posts: "1.9K", category: "Beauty" },
    ]);
  }, [loadFeed]);

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadFeed(nextPage, true);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, page, loadFeed]
  );

  const handlePostCreated = (newPost) => {
    setFeedItems((prev) => [{ type: "post", ...newPost }, ...prev]);
  };

  // 🔥 ADD HERE (above return)

const slides = [
  "/slide1.jpg",
  "/slide2.jpg",
  "/slide3.jpg"
];

const [currentSlide, setCurrentSlide] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, 5000);

  return () => clearInterval(interval);
}, []);

  return (
    <div className="ph-layout">
      
      {/* LEFT SIDEBAR */}
      <aside className="ph-sidebar-left">
        <div className="ph-sidebar-logo">
          <span className="ph-logo-text">
            Pad<span className="ph-logo-accent">Hatke</span>
          </span>
        </div>

        <nav className="ph-nav">
  <a href="#" className="ph-nav-item active">
    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#000">
      <path d="M226.67-186.67h140v-246.66h226.66v246.66h140v-380L480-756.67l-253.33 190v380ZM160-120v-480l320-240 320 240v480H526.67v-246.67h-93.34V-120H160Zm320-352Z"/>
    </svg>
    <span>Home</span>
  </a>

  <a href="#" className="ph-nav-item">
    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#000">
      <path d="m302-302 273.33-82 82-273.33-273.33 82L302-302Zm177.84-131.33q-19.51 0-33.01-13.66-13.5-13.66-13.5-33.17t13.66-33.01q13.66-13.5 33.17-13.5t33.01 13.66q13.5 13.66 13.5 33.17t-13.66 33.01q-13.66 13.5-33.17 13.5ZM480.18-80q-82.83 0-155.67-31.5-72.84-31.5-127.18-85.83Q143-251.67 111.5-324.56T80-480.33q0-82.88 31.5-155.78Q143-709 197.33-763q54.34-54 127.23-85.5T480.33-880q82.88 0 155.78 31.5Q709-817 763-763t85.5 127Q880-563 880-480.18q0 82.83-31.5 155.67Q817-251.67 763-197.46q-54 54.21-127 85.84Q563-80 480.18-80Zm.14-66.67q138.68 0 235.85-97.49 97.16-97.49 97.16-236.16 0-138.68-97.16-235.85-97.17-97.16-235.85-97.16-138.67 0-236.16 97.16-97.49 97.17-97.49 235.85 0 138.67 97.49 236.16 97.49 97.49 236.16 97.49ZM480-480Z"/>
    </svg>
    <span>Explore</span>
  </a>

  <a href="#" className="ph-nav-item">
    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#000">
      <path d="M160-200v-66.67h80v-296q0-83.66 49.67-149.5Q339.33-778 420-796v-24q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v24q80.67 18 130.33 83.83Q720-646.33 720-562.67v296h80V-200H160Zm320-301.33ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM306.67-266.67h346.66v-296q0-72-50.66-122.66Q552-736 480-736t-122.67 50.67q-50.66 50.66-50.66 122.66v296Z"/>
    </svg>
    <span>Notifications</span>
  </a>

  <a href="#" className="ph-nav-item">
    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#000">
      <path d="M240-399.33h315.33V-466H240v66.67ZM240-526h480v-66.67H240V-526Zm0-126.67h480v-66.66H240v66.66ZM80-80v-733.33q0-27 19.83-46.84Q119.67-880 146.67-880h666.66q27 0 46.84 19.83Q880-840.33 880-813.33v506.66q0 27-19.83 46.84Q840.33-240 813.33-240H240L80-80Zm131.33-226.67h602v-506.66H146.67v575l64.66-68.34Zm-64.66 0v-506.66 506.66Z"/>
    </svg>
    <span>Messages</span>
  </a>

  {user && (
    <a href="#" className="ph-nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#000">
        <path d="M370.33-524.33Q326.67-568 326.67-634t43.66-109.67Q414-787.33 480-787.33t109.67 43.66Q633.33-700 633.33-634t-43.66 109.67Q546-480.67 480-480.67t-109.67-43.66ZM160-160v-100q0-36.67 18.5-64.17T226.67-366q65.33-30.33 127.66-45.5 62.34-15.17 125.67-15.17t125.33 15.5q62 15.5 127.34 45.17 30.33 14.33 48.83 41.83T800-260v100H160Zm66.67-66.67h506.66V-260q0-14.33-8.16-27-8.17-12.67-20.5-19-60.67-29.67-114.34-41.83Q536.67-360 480-360t-111 12.17Q314.67-335.67 254.67-306q-12.34 6.33-20.17 19-7.83 12.67-7.83 27v33.33Zm315.16-345.5Q566.67-597 566.67-634t-24.84-61.83Q517-720.67 480-720.67t-61.83 24.84Q393.33-671 393.33-634t24.84 61.83Q443-547.33 480-547.33t61.83-24.84ZM480-634Zm0 407.33Z"/>
      </svg>
      <span>Profile</span>
    </a>
  )}
</nav>

        
      </aside>

      {/* CENTER FEED */}
      <main className="ph-feed-main">

        {/* Header */}
        <div className="ph-feed-header">
  <div className="ph-header-profile">
    <div className="ph-header-avatar">
  R
</div>
    <h2>
  {user?.display_name
    ? `@${user.display_name.toLowerCase().replace(/\s+/g, "_")}`
    : "Login to post"}
</h2>
  </div>
</div>

        {/* Composer */}
        <div className="ph-composer-box">
          <ComposePost onPostCreated={handlePostCreated} />
        </div>

        {/* Feed */}
        <div className="ph-feed-list">
          {feedItems.map((item, index) => {
            const isLast = index === feedItems.length - 1;

            if (item.type === "ad") {
              return (
                <div className="ph-card">
                  <AdCard key={`ad-${item.id}-${index}`} ad={item} />
                </div>
              );
            }

            return (
              <div
                className="ph-card"
                key={`post-${item.id}-${index}`}
                ref={isLast ? lastPostRef : null}
              >
                <PostCard post={item} />
              </div>
            );
          })}

          {loading && (
            <div className="ph-loading">
              <div className="ph-loading-spinner"></div>
              <p>Loading posts...</p>
            </div>
          )}

          {!loading && feedItems.length === 0 && (
            <div className="ph-empty">
              <h3>No posts yet</h3>
              <p>Be the first to share something!</p>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="ph-sidebar-right">

        {/* Trending */}
        <div className="ph-slider">
  <div
    className="ph-slider-track"
    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
  >
    {slides.map((slide, index) => (
      <img key={index} src={slide} className="ph-slide" />
    ))}
  </div>

  <div className="ph-slider-dots">
    {slides.map((_, index) => (
      <button
        key={index}
        className={`ph-dot ${currentSlide === index ? "active" : ""}`}
        onClick={() => setCurrentSlide(index)}
      />
    ))}
  </div>
</div>

        {/* Promo */}
        <div className="ph-promo-card">
          <h4>🛒 BuyHatke Deals</h4>
          <p>Buy Now</p>
          <a href="/buyhatke" className="ph-promo-btn">
            Explore →
          </a>
        </div>
      </aside>
    </div>
  );
}

export default PadHatkeFeed;