import axios from 'axios'
import { getSession } from 'next-auth/react'

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add authentication interceptor
api.interceptors.request.use(async (config) => {
  const session = await getSession()
  
  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

// Handle refresh token logic (simplified version)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const session = await getSession()
        
        // This is a simplified approach - in a production app you would:
        // 1. Use the refresh token to get a new access token
        // 2. Update the session
        // 3. Retry the original request

        // For demo purposes, we'll just redirect to login
        window.location.href = '/login'
        return Promise.reject(error)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

// Helper functions for common API operations
export const apiHelpers = {
  // Auth
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },
  
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password })
    return response.data
  },
  
  // Chat
  getSessions: async () => {
    const response = await api.get('/chat/sessions')
    return response.data
  },
  
  getSession: async (sessionId: string) => {
    const response = await api.get(`/chat/sessions/${sessionId}`)
    return response.data
  },
  
  sendMessage: async (sessionId: string | null, message: string) => {
    const response = await api.post('/chat/send', {
      session_id: sessionId,
      message,
    })
    return response.data
  },
  
  deleteSession: async (sessionId: string) => {
    const response = await api.delete(`/chat/sessions/${sessionId}`)
    return response.data
  },
  
  // History
  getHistory: async (page = 1, perPage = 10) => {
    const response = await api.get('/history', {
      params: { page, per_page: perPage }
    })
    return response.data
  },
  
  deleteHistoryItem: async (historyId: string) => {
    const response = await api.delete(`/history/${historyId}`)
    return response.data
  },
  
  clearHistory: async () => {
    const response = await api.delete('/history/clear')
    return response.data
  }
}