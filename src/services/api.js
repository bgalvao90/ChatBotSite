import axios from "axios";
import qs from "qs";

// Altere aqui conforme o endereço da sua API
const api = axios.create({
  baseURL: "https://localhost:7169/api",
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});

// Interceptador para anexar token (caso use autenticação JWT)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
