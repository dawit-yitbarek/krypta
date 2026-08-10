class FetchInstance {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json(); // Automatically parse JSON to match Axios behavior
  }

  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  post(endpoint: string, body: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

// Export the instance
export const api = new FetchInstance(import.meta.env.VITE_BACKEND_URL);