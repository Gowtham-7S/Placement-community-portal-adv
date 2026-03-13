const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const config = require('./config/environment');
const { pool, initializeDatabase } = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const juniorRoutes = require('./routes/juniorRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Initialize Express app
const app = express();

// ========== MIDDLEWARE ==========

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ========== ROUTES ==========

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/junior', juniorRoutes);
app.use('/api/public', publicRoutes);

// Root route - provide a friendly message and health quick-check
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Placement Intelligence Portal API - running',
    health: '/api/public/health'
  });
});
// ========== ERROR HANDLING ==========

// 404 Not Found handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ========== SERVER STARTUP ==========

const startServer = async () => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful:', result.rows[0]);

    // Initialize database (if needed)
    await initializeDatabase();

    // Start server
    const server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server is running on http://localhost:${config.PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info(`🔐 CORS enabled for: ${config.CORS_ORIGIN}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        pool.end(() => {
          logger.info('Database connection pool closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        pool.end(() => {
          logger.info('Database connection pool closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
