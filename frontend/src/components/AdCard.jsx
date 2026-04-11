/**
 * AdCard — Sponsored ad card for PadHatke feed.
 * Displays product ad with "Sponsored" badge.
 * Click → navigates to BuyHatke product page.
 */
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import tracker from "../utils/tracker";

function AdCard({ ad }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const hasTrackedImpression = useRef(false);
  const cardRef = useRef(null);

  // Track impression when ad becomes visible
  useEffect(() => {
    if (!hasTrackedImpression.current && ad.id) {
      api.trackAdImpression(ad.id).catch(() => {});
      hasTrackedImpression.current = true;
    }
  }, [ad.id]);

  const handleClick = async () => {
    // Track ad click
    try {
      await api.trackAdClick(ad.id, token);
      tracker.trackClick("ad", ad.id);
    } catch (err) {
      console.error("Ad click tracking failed:", err);
    }

    // Navigate to BuyHatke product page
    navigate(`/buyhatke/product/${ad.product_id}`);
  };

  return (
    <div className="ph-ad-card" ref={cardRef} onClick={handleClick} role="button" tabIndex={0}>
      <div className="ph-ad-badge">Sponsored</div>

      <div className="ph-ad-content">
        <div className="ph-ad-left">
          <div className="ph-ad-avatar">
            <span>🛍️</span>
          </div>
          <div className="ph-ad-info">
            <div className="ph-ad-header">
              <span className="ph-ad-brand">BuyHatke Store</span>
              <span className="ph-ad-verified">✓</span>
              <span className="ph-ad-promo">· Promoted</span>
            </div>
            <div className="ph-ad-title">{ad.title}</div>
            {ad.description && (
              <div className="ph-ad-description">{ad.description}</div>
            )}
          </div>
        </div>

        {ad.image_url && (
          <div className="ph-ad-image">
            <img src={ad.image_url} alt={ad.title} loading="lazy" />
            <div className="ph-ad-shop-badge">Shop Now →</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdCard;
