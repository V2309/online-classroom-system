import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,

  // Cho phép browser gửi cookie
  withCredentials: true,

  headers: {
    'Content-Type': 'application/json',
  },
});