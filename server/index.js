import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chats.js';
import messageRoutes from './routes/messages.js';
import { verifyToken } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', verifyToken, chatRoutes);
app.use('/api/messages', verifyToken, messageRoutes);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://pranay-chat-app.onrender.com'], // Allow local dev and hosted frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true
  }
});

// Online users management
const onlineUsers = new Map();

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User joins with their userId
  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
    onlineUsers.set(userData._id, socket.id);
    
    // Broadcast online status to all users
    io.emit('user-status-update', {
      userId: userData._id,
      status: 'online'
    });
  });
  
  // User joins a chat
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log('User joined chat:', chatId);
  });
  
  // Typing indicators
  socket.on('typing', (chatId) => {
    socket.to(chatId).emit('typing', chatId);
  });
  
  socket.on('stop-typing', (chatId) => {
    socket.to(chatId).emit('stop-typing', chatId);
  });
  
  // New message
  socket.on('new-message', (message) => {
    let chat = message.chat;
    
    if (!chat.users) return console.log('Chat users not defined');
    
    chat.users.forEach(user => {
      if (user._id === message.sender._id) return;
      socket.to(user._id).emit('message-received', message);
    });
  });
  
  // Message read
  socket.on('message-read', (messageData) => {
    const { messageId, chatId, reader } = messageData;
    socket.to(chatId).emit('message-read-update', {
      messageId,
      readBy: reader
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find the userId associated with this socket
    let userId = null;
    for (const [key, value] of onlineUsers.entries()) {
      if (value === socket.id) {
        userId = key;
        break;
      }
    }
    
    if (userId) {
      onlineUsers.delete(userId);
      // Broadcast offline status to all users
      io.emit('user-status-update', {
        userId: userId,
        status: 'offline'
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));