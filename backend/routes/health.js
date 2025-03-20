const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.get('/', (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      message: 'Backend server is running',
      timestamp: new Date().toISOString()
    });

    logger.info({
      message: 'Health check endpoint accessed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({
      message: 'Error in health check endpoint',
      error: error.message
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;