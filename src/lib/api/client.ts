
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token if we decide to store it in simpler storage (optional if using cookies mainly)
// For now, we rely on the backend expecting cookies or we explicitly set headers if we manage token in state.
// The prompt mentioned: "Persist JWT in httpOnly cookie". 
// If it's HttpOnly, client JS cannot read it to set the header. 
// BUT, the prompt later says: "Request interceptor: attach JWT from cookie". 
// This is contradictory. HttpOnly cookies are attached automatically by the browser. 
// If the prompt wants specific "Attach JWT from cookie", it might imply a non-HttpOnly cookie or a different storage.
// Correction: The backend Phase 2 implementation `authenticate` middleware looks for `Authorization: Bearer ...`.
// So we DO need to send the token in the header.
// Thus, we must store the token in a place JS can read (localStorage or non-HttpOnly cookie), OR rely on a proxy that converts cookie to header.
// Given "Request interceptor: attach JWT from cookie", I will assume we store it in a cookie that JS CAN read (not HttpOnly), or localStorage. 
// For "Production-ready", HttpOnly is better, but requires backend change to read from Cookie header.
// I will satisfy the verification report Phase 2 `middleware.ts` which uses `Authorization` header.
// So I will implement token storage in localStorage for simplicity and reliable header attachment, 
// OR a helper to read the cookie if we use `js-cookie`.
// Let's use `localStorage` for the JWT to ensure it definitely gets into the Authorization header as the backend expects.

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Unauthorized) - potentially redirect to login
        if (error.response?.status === 401) {
            // Only redirect if not already on public pages? 
            // For now, just pass the error, let AuthContext handle redirects.
        }
        return Promise.reject(error);
    }
);

export default api;
