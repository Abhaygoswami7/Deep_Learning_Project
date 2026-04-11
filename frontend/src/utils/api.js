/**
 * API utility — All backend API calls for both platforms.
 * Includes auth, feed, ads, tracking, and recommendation endpoints.
 */
const API_BASE = "http://127.0.0.1:8000";

function authHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  // ==================== AUTH ====================
  login: (username, password) =>
    request(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),

  signup: (username, email, password, display_name) =>
    request(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, display_name }),
    }),

  getMe: (token) =>
    request(`${API_BASE}/auth/me`, {
      headers: authHeaders(token),
    }),

  // ==================== PRODUCTS ====================
  getProducts: () => fetch(`${API_BASE}/products`).then((r) => r.json()),

  getProduct: (id) => fetch(`${API_BASE}/products/${id}`).then((r) => r.json()),

  getRecommendations: (id) =>
    fetch(`${API_BASE}/recommend/${id}`).then((r) => r.json()),

  getSmartRecommendations: (id, token) =>
    fetch(`${API_BASE}/recommend/smart/${id}`, {
      headers: authHeaders(token),
    }).then((r) => r.json()),

  getForYou: (token) =>
    fetch(`${API_BASE}/recommend/for-you`, {
      headers: authHeaders(token),
    }).then((r) => r.json()),

  getPersonalized: () =>
    fetch(`${API_BASE}/personalized`).then((r) => r.json()),

  getTrending: () => fetch(`${API_BASE}/trending`).then((r) => r.json()),

  getHybrid: (id) =>
    fetch(`${API_BASE}/hybrid/${id}`).then((r) => r.json()),

  getCategory: (id) =>
    fetch(`${API_BASE}/category/${id}`).then((r) => r.json()),

  trackClick: (id) =>
    fetch(`${API_BASE}/track_click/${id}`, { method: "POST" }).then((r) =>
      r.json()
    ),

  search: (query) =>
    fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`).then((r) =>
      r.json()
    ),

  getUserHistory: () =>
    fetch(`${API_BASE}/user_history`).then((r) => r.json()),

  // ==================== FEED (PadHatke) ====================
  getFeed: (page = 1, token) =>
    fetch(`${API_BASE}/feed?page=${page}&limit=20`, {
      headers: authHeaders(token),
    }).then((r) => r.json()),

  createPost: (content, token, imageUrl = "", linkUrl = "") =>
    request(`${API_BASE}/feed/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({
        content,
        image_url: imageUrl,
        link_url: linkUrl,
      }),
    }),

  likePost: (postId, token) =>
    fetch(`${API_BASE}/feed/posts/${postId}/like`, {
      method: "POST",
      headers: authHeaders(token),
    }).then((r) => r.json()),

  commentPost: (postId, text, token) =>
    request(`${API_BASE}/feed/posts/${postId}/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ text }),
    }),

  getComments: (postId) =>
    fetch(`${API_BASE}/feed/posts/${postId}/comments`).then((r) => r.json()),

  sharePost: (postId, token) =>
    fetch(`${API_BASE}/feed/posts/${postId}/share`, {
      method: "POST",
      headers: authHeaders(token),
    }).then((r) => r.json()),

  // ==================== ADS ====================
  getFeedAds: (limit = 5, token) =>
    fetch(`${API_BASE}/ads/feed?limit=${limit}`, {
      headers: authHeaders(token),
    }).then((r) => r.json()),

  trackAdClick: (adId, token) =>
    fetch(`${API_BASE}/ads/${adId}/click`, {
      method: "POST",
      headers: authHeaders(token),
    }).then((r) => r.json()),

  trackAdImpression: (adId) =>
    fetch(`${API_BASE}/ads/${adId}/impression`, { method: "POST" }).then((r) =>
      r.json()
    ),

  getAdAnalytics: () =>
    fetch(`${API_BASE}/ads/analytics`).then((r) => r.json()),

  // ==================== TRACKING ====================
  trackEvent: (event, token) =>
    fetch(`${API_BASE}/track/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(event),
    }).then((r) => r.json()),

  trackBatch: (events, token) =>
    fetch(`${API_BASE}/track/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify({ events }),
    }).then((r) => r.json()),

  getUserProfile: (userId) =>
    fetch(`${API_BASE}/track/user/${userId}/profile`).then((r) => r.json()),

  getTrackingStats: () =>
    fetch(`${API_BASE}/track/stats`).then((r) => r.json()),
};

export default api;
