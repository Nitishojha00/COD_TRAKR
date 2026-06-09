import axios from 'axios';

export const API = 'http://127.0.0.1:4000';

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

export default api;
