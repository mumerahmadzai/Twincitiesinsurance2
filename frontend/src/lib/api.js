import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "tci_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const apiClient = axios.create({
    baseURL: API,
    headers: { "Content-Type": "application/json" },
});

// Attach Bearer token automatically when present
apiClient.interceptors.request.use((config) => {
    const t = getToken();
    if (t) config.headers.Authorization = `Bearer ${t}`;
    return config;
});

// Auto-logout on 401
apiClient.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            clearToken();
        }
        return Promise.reject(err);
    }
);

export async function submitQuote(payload) {
    const { data } = await apiClient.post("/quotes", payload);
    return data;
}

export async function listQuotes() {
    const { data } = await apiClient.get("/quotes");
    return data;
}

export async function adminLogin(email, password) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    setToken(data.token);
    return data.user;
}

export async function adminMe() {
    const { data } = await apiClient.get("/auth/me");
    return data;
}

export async function createShareLink(quoteId) {
    const { data } = await apiClient.post(`/quotes/${quoteId}/share-link`);
    return data;
}

export async function fetchSharedQuote(token) {
    // No auth header for this public endpoint
    const { data } = await axios.get(`${API}/share/${encodeURIComponent(token)}`);
    return data;
}

export function buildShareUrl(token) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/share/${encodeURIComponent(token)}`;
}

export function isAuthenticated() {
    return !!getToken();
}

export function logout() {
    clearToken();
}
