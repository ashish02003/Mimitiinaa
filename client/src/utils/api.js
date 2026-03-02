// Central API base for the frontend. Edit VITE_API_URL in .env to change backend.
export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

export default API_BASE;
