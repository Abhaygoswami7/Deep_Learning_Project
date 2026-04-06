const API_BASE = 'http://127.0.0.1:8000';

const api = {
  getProducts: () =>
    fetch(`${API_BASE}/products`).then(r => r.json()),

  getRecommendations: (id) =>
    fetch(`${API_BASE}/recommend/${id}`).then(r => r.json()),

  getPersonalized: () =>
    fetch(`${API_BASE}/personalized`).then(r => r.json()),

  getTrending: () =>
    fetch(`${API_BASE}/trending`).then(r => r.json()),

  getHybrid: (id) =>
    fetch(`${API_BASE}/hybrid/${id}`).then(r => r.json()),

  getCategory: (id) =>
    fetch(`${API_BASE}/category/${id}`).then(r => r.json()),

  trackClick: (id) =>
    fetch(`${API_BASE}/track_click/${id}`, { method: 'POST' }).then(r => r.json()),

  search: (query) =>
    fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`).then(r => r.json()),

  getUserHistory: () =>
    fetch(`${API_BASE}/user_history`).then(r => r.json()),
};

export default api;
