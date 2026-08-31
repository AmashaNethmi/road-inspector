// server.js – entry point for the Repair Area Segmentation backend
try {
  require('dns').setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (_) {}
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Root health check and welcoming endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Road Inspector AI - Repair Area Segmentation Backend',
    version: '2.0.0',
    frontend_url: 'http://localhost:5173',
    endpoints: {
      health: '/api/health',
      segmentation: 'POST /api/repair-area-segmentation',
      results: 'GET /api/results',
      reports: 'GET /api/reports',
      citizen_reports: 'GET /api/citizen-reports'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Road Inspector API is online',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRouter);

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || '';
if (!mongoUri) {
  console.warn('⚠️ MONGODB_URI not set in .env. Running in memory-fallback mode.');
} else {
  mongoose
    .connect(mongoUri, { 
      dbName: process.env.MONGODB_DB || 'roadinspector',
      serverSelectionTimeoutMS: 4000
    })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
      console.warn('⚠️ MongoDB connection error (server running in fallback mode):', err.message);
    });
}

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});


