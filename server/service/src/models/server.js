const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Server = sequelize.define('Server', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  uuid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  os_info: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  client_ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cpu_cores: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ram_total: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // 0: Offline, 1: Online
  },
  last_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  uptime: {
    type: DataTypes.BIGINT, // Seconds
    allowNull: true,
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: true, // If null, use global secret or no secret
  },
});

module.exports = Server;
