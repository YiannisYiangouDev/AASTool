import axios from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 15000,
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