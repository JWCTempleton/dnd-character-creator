import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5001/api", // backend API base URL
  withCredentials: true,
});

export default apiClient;
