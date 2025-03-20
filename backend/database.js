const { Pool } = require('pg');
const config = require('./config');
const logger = require('../src/utils/logger');

const pool = new Pool({
  connectionString: config.database.url,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error connecting to the database:', err.stack);
    return;
  }
  logger.info('Successfully connected to the database');
  release();
});

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};