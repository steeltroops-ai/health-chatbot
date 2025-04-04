import axios from "axios";
import { getSession, signOut } from "next-auth/react";

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

// Add authentication interceptor
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();

    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }

    return config;
  },
  (error) => {
    console.error("API request error:", error);
    return Promise.reject(error);
  }
);

// Handle refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;

      try {
        const session = await getSession();

        if (session?.user?.refreshToken) {
          // Use the refresh token to get a new access token
          const refreshResponse = await axios.post(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
            }/auth/refresh`,
            { refresh_token: session.user.refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const { access_token } = refreshResponse.data;

          if (access_token) {
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;

            // Update the session store (would require a more complex implementation)
            // For now, we'll just use the new token for this request

            // Retry the original request with the new token
            return api(originalRequest);
          }
        }

        // If refresh token is missing or refresh failed, sign out
        await signOut({ redirect: false });
        window.location.href = "/login?error=session_expired";
        return Promise.reject(error);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Sign out on refresh failure
        await signOut({ redirect: false });
        window.location.href = "/login?error=session_expired";
        return Promise.reject(error);
      }
    }

    // Handle server errors with helpful messages
    if (error.response?.status === 500) {
      console.error("Server error:", error.response?.data);
      error.message =
        "The server encountered an error. Please try again later.";
    }

    // Handle rate limit errors (429)
    if (error.response?.status === 429) {
      console.error("Rate limit error:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Rate limit exceeded";

      if (errorMsg.includes("quota")) {
        error.message =
          "The AI service quota has been exceeded. Please try again later or contact support.";
      } else {
        error.message =
          "Too many requests. Please wait a moment before trying again.";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API operations
export const apiHelpers = {
  // Auth
  login: async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      return response.data;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  },

  register: async (username: string, email: string, password: string) => {
    try {
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // Chat
  getSessions: async () => {
    try {
      const response = await api.get("/chat/sessions");
      return response.data;
    } catch (error: any) {
      console.error(
        "Get sessions error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getSession: async (sessionId: string) => {
    try {
      const response = await api.get(`/chat/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get session ${sessionId} error:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  sendMessage: async (sessionId: string | null, message: string) => {
    try {
      const payload = sessionId
        ? { session_id: sessionId, message }
        : { message };

      const response = await api.post("/chat/send", payload);
      return response.data;
    } catch (error: any) {
      console.error(
        "Send message error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      const response = await api.delete(`/chat/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Delete session ${sessionId} error:`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  // History
  getHistory: async (page = 1, perPage = 10) => {
    try {
      const response = await api.get("/history", {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Get history error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  clearHistory: async () => {
    try {
      const response = await api.delete("/history/clear");
      return response.data;
    } catch (error: any) {
      console.error(
        "Clear history error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
