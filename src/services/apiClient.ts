import axios from "axios";

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // backend API base URL
  withCredentials: true,
});

export default apiClient;
