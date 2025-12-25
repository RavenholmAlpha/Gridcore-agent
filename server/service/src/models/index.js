const sequelize = require('../config/db');
const Server = require('./server');
const Metric = require('./metric');

// Associations
Server.hasMany(Metric, { foreignKey: 'server_id', onDelete: 'CASCADE' });
Metric.belongsTo(Server, { foreignKey: 'server_id', onDelete: 'CASCADE' });

const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    await sequelize.sync(); // Sync models without altering table structure
    console.log('Database synced.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  Server,
  Metric,
  initDB,
};
