const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/gridcore.db';
const fullPath = path.resolve(__dirname, '../../', dbPath);

// Ensure directory exists
const dir = path.dirname(fullPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: fullPath,
  logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;
