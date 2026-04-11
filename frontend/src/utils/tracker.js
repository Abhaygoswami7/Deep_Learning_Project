/**
 * Client-Side Behavior Tracker
 * Tracks: clicks, hover time, scroll depth, view duration, scroll pauses.
 * Batches events and flushes to the backend every 5 seconds.
 */
import api from "./api";

class BehaviorTracker {
  constructor() {
    this.eventQueue = [];
    this.sessionId = this._generateSessionId();
    this.platform = "buyhatke";
    this.token = "";
    this.flushInterval = null;
    this.scrollTimer = null;
    this.lastScrollTime = 0;
    this.maxScrollDepth = 0;
    this.pauseTimer = null;
    this.isRunning = false;
  }

  _generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Initialize the tracker. Call once on app mount.
   */
  init(platform = "buyhatke", token = "") {
    if (this.isRunning) return;
    this.platform = platform;
    this.token = token;
    this.isRunning = true;

    // Flush events every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5000);

    // Track scroll depth
    this._initScrollTracking();

    // Track scroll pause behavior
    this._initPauseDetection();

    // Flush on page unload
    window.addEventListener("beforeunload", () => this.flush());
  }

  /**
   * Update auth token (call when user logs in/out)
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set current platform context
   */
  setPlatform(platform) {
    this.platform = platform;
  }

  /**
   * Stop the tracker
   */
  stop() {
    this.flush();
    if (this.flushInterval) clearInterval(this.flushInterval);
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.isRunning = false;
  }

  // ==================== EVENT LOGGING ====================

  /**
   * Track a click event
   */
  trackClick(targetType, targetId, metadata = {}) {
    this._addEvent("click", targetType, targetId, 0, 0, metadata);
  }

  /**
   * Track hover time on an element
   */
  trackHover(targetType, targetId, durationMs) {
    if (durationMs < 500) return; // Ignore micro-hovers
    this._addEvent("hover", targetType, targetId, durationMs, 0, {});
  }

  /**
   * Track time spent viewing content
   */
  trackView(targetType, targetId, durationMs) {
    if (durationMs < 1000) return; // Ignore sub-second views
    this._addEvent("view", targetType, targetId, durationMs, 0, {});
  }

  /**
   * Track like interaction
   */
  trackLike(targetType, targetId) {
    this._addEvent("like", targetType, targetId, 0, 0, {});
  }

  /**
   * Track share interaction
   */
  trackShare(targetType, targetId) {
    this._addEvent("share", targetType, targetId, 0, 0, {});
  }

  /**
   * Track a scroll pause (user stops scrolling for > 1.5s)
   */
  trackPause(scrollDepth) {
    this._addEvent("pause", "page", 0, 0, scrollDepth, {});
  }

  /**
   * Track scroll depth
   */
  trackScroll(scrollDepth) {
    this._addEvent("scroll", "page", 0, 0, scrollDepth, {});
  }

  // ==================== INTERNAL ====================

  _addEvent(eventType, targetType, targetId, durationMs, scrollDepth, metadata) {
    this.eventQueue.push({
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      duration_ms: Math.round(durationMs),
      scroll_depth: Math.round(scrollDepth * 100) / 100,
      metadata: JSON.stringify(metadata),
      platform: this.platform,
      session_id: this.sessionId,
    });

    // Auto-flush if queue is large
    if (this.eventQueue.length >= 20) {
      this.flush();
    }
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await api.trackBatch(events, this.token);
    } catch (err) {
      // Silently fail — don't disrupt UX for tracking failures
      console.debug("Tracker flush failed:", err.message);
      // Re-add events to queue for retry (max 50 to prevent memory leak)
      if (this.eventQueue.length < 50) {
        this.eventQueue.push(...events.slice(0, 50 - this.eventQueue.length));
      }
    }
  }

  _initScrollTracking() {
    let scrollTrackTimeout = null;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? scrollTop / docHeight : 0;

      if (depth > this.maxScrollDepth) {
        this.maxScrollDepth = depth;
      }

      this.lastScrollTime = Date.now();

      // Debounced scroll depth logging
      if (scrollTrackTimeout) clearTimeout(scrollTrackTimeout);
      scrollTrackTimeout = setTimeout(() => {
        if (this.maxScrollDepth > 0.1) {
          this.trackScroll(this.maxScrollDepth);
        }
      }, 2000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  _initPauseDetection() {
    let lastScrollY = 0;

    const checkPause = () => {
      const now = Date.now();
      const currentScrollY = window.scrollY || 0;
      const timeSinceLastScroll = now - this.lastScrollTime;

      // If user hasn't scrolled for 1.5+ seconds and has scrolled at all
      if (timeSinceLastScroll > 1500 && this.lastScrollTime > 0 && currentScrollY !== lastScrollY) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const depth = docHeight > 0 ? currentScrollY / docHeight : 0;
        this.trackPause(depth);
        lastScrollY = currentScrollY;
      }
    };

    setInterval(checkPause, 2000);
  }
}

// Singleton instance
const tracker = new BehaviorTracker();
export default tracker;
