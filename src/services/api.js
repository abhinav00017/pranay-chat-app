import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5123/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth service
export const authService = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    return await api.get('/users/me');
  }
};

// User service
export const userService = {
  getAllUsers: async () => {
    return await api.get('/users');
  },
  
  updateProfile: async (userData) => {
    return await api.put('/users/me', userData);
  }
};

// Chat service
export const chatService = {
  // Get all chats for current user
  getChats: async () => {
    return await api.get('/chats');
  },
  
  // Create a new chat or access existing one
  createChat: async (userId) => {
    return await api.post('/chats', { userId });
  },
  
  // Get a single chat by ID
  getChatById: async (chatId) => {
    return await api.get(`/chats/${chatId}`);
  }
};

// Message service
export const messageService = {
  // Send a new message
  sendMessage: async (chatId, content) => {
    return await api.post('/messages', { chatId, content });
  },
  
  // Get all messages for a chat
  getMessages: async (chatId) => {
    return await api.get(`/messages/${chatId}`);
  },
  
  // Mark message as read
  markAsRead: async (messageId) => {
    return await api.put('/messages/read', { messageId });
  }
};

export default api;