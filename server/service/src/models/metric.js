const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Server = require('./server');

const Metric = sequelize.define('Metric', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  server_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Server,
      key: 'id',
    },
  },
  cpu_usage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  ram_usage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  disk_usage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  net_in_rate: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  net_out_rate: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
}, {
  indexes: [
    {
      fields: ['server_id'],
    },
    {
      fields: ['createdAt'],
    },
  ],
});

module.exports = Metric;
