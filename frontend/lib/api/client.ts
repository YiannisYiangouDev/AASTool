import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  if (typeof window !== "undefined") {
    console.warn(
      "[AASTool] NEXT_PUBLIC_API_URL is not set. The frontend will not function correctly.",
      "Set NEXT_PUBLIC_API_URL to the backend API base URL.",
      "Example: NEXT_PUBLIC_API_URL=https://api.example.com/api/v1",
    );
  }
}

export const api = axios.create({
  baseURL: baseURL || "/api/v1",
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "15000", 10),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response) {
      const { status, data } = error.response;
      const normalized =
        typeof data === "object" && data !== null
          ? { status, ...data }
          : { status, data, message: String(data) };
      return Promise.reject(normalized);
    }
    return Promise.reject({
      status: 0,
      message: error?.message ?? "Network error",
    });
  },
);

export default api;