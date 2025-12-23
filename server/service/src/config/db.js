const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/gridcore.db';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../../', dbPath),
  logging: false, // Set to console.log to see SQL queries
});

module.exports = sequelize;
