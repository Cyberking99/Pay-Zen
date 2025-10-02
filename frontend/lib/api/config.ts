import { getAccessToken } from "@privy-io/react-auth";
import axios from "axios"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (config.headers['X-Authorization-Override']) {
      config.headers.Authorization = config.headers['X-Authorization-Override'];
      delete config.headers['X-Authorization-Override'];
    } else {
      // Otherwise, use the Privy token
      // const token = await getAccessToken();
      // if (token) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
      // Get auth token from localStorage or session
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")
        window.location.href = "/"
      }
    }

    return Promise.reject(error)
  },
)
