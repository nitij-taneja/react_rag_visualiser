/**
 * API Service with proxy support and error handling
 * Handles communication with Python backend
 */

// Determine backend URL based on environment
function getBackendUrl(): string {
  // In development, try localhost first, then fallback to proxy
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  }
  
  // In production, use relative path (proxy through same domain)
  return import.meta.env.VITE_BACKEND_URL || "/api/backend";
}

const BACKEND_URL = getBackendUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;
  private timeout: number = 30000; // 30 seconds

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return await response.json();
    } catch (error) {
      return this.handleError(error, endpoint);
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      return await response.json();
    } catch (error) {
      return this.handleError(error, endpoint);
    }
  }

  /**
   * Fetch with timeout
   */
  private fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), this.timeout)
      ),
    ]);
  }

  /**
   * Handle errors with user-friendly messages
   */
  private handleError(error: any, endpoint: string): ApiResponse {
    console.error(`API Error on ${endpoint}:`, error);

    let errorMessage = "Failed to connect to backend";

    if (error instanceof TypeError) {
      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          "Backend server is not running. Please start the Python backend with: python run.py";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout. Backend is taking too long to respond.";
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

/**
 * Document API endpoints
 */
export const documentsApi = {
  upload: (data: {
    title: string;
    content: string;
    mime_type?: string;
  }) => apiService.post("/api/documents/upload", data),

  getAll: () => apiService.get("/api/documents"),
};

/**
 * Query API endpoints
 */
export const queriesApi = {
  process: (query: string) =>
    apiService.post("/api/query", { query }),

  getHistory: () => apiService.get("/api/queries/history"),

  getById: (id: number) =>
    apiService.get(`/api/queries/${id}`),
};

/**
 * Agent API endpoints
 */
export const agentApi = {
  getState: () => apiService.get("/api/agent/state"),
};

/**
 * Metrics API endpoints
 */
export const metricsApi = {
  getMetrics: () => apiService.get("/api/metrics"),
};
