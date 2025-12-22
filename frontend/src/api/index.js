import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for token addition
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// AUTH API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/me"),
};

// LIBRARY API
export const libraryAPI = {
  getLibrary: (params) => api.get("/library", { params }),
  getGame: (id) => api.get(`/library/${id}`),
  addGame: (data) => api.post("/library", data),
  updateGame: (id, data) => api.put(`/library/${id}`, data),
  deleteGame: (id) => api.delete(`/library/${id}`),

  // Search
  search: (query, source = "all") =>
    api.get("/library/search", { params: { q: query, source } }),

  // Stats
  getStats: () => api.get("/library/stats"),
  getDashboard: () => api.get("/library/dashboard"),

  // Import
  importFromSteam: (data) => api.post("/library/import/steam", data),
};

export default api;
