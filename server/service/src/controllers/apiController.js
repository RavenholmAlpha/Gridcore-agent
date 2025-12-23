const { Server, Metric } = require('../models');
const { Op } = require('sequelize');

// Get all servers
const getServers = async (req, res) => {
  try {
    const servers = await Server.findAll({
      attributes: ['id', 'uuid', 'name', 'os_info', 'status', 'last_seen', 'cpu_cores', 'ram_total'],
      order: [['status', 'DESC'], ['id', 'ASC']], // Online first
    });
    
    // Attach latest metrics for each server (optional optimization: separate query or subquery)
    // For simplicity, we just fetch latest metric for each server here or frontend fetches details
    // Let's attach the very last metric to show current load
    const result = await Promise.all(servers.map(async (server) => {
      const latestMetric = await Metric.findOne({
        where: { server_id: server.id },
        order: [['createdAt', 'DESC']],
      });
      return {
        ...server.toJSON(),
        latest_metric: latestMetric,
      };
    }));

    return res.json({ code: 200, data: result });
  } catch (error) {
    console.error('Get servers error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Get server details and history metrics
const getServerMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const { range } = req.query; // e.g., '1h', '24h'

    const server = await Server.findByPk(id);
    if (!server) {
      return res.status(404).json({ code: 404, message: 'Server not found' });
    }

    let timeFilter = new Date();
    if (range === '24h') {
      timeFilter.setHours(timeFilter.getHours() - 24);
    } else if (range === '7d') {
      timeFilter.setDate(timeFilter.getDate() - 7);
    } else {
      // Default 1h
      timeFilter.setHours(timeFilter.getHours() - 1);
    }

    const metrics = await Metric.findAll({
      where: {
        server_id: id,
        createdAt: {
          [Op.gte]: timeFilter,
        },
      },
      order: [['createdAt', 'ASC']],
    });

    return res.json({
      code: 200,
      data: {
        server,
        metrics,
      },
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

module.exports = {
  getServers,
  getServerMetrics,
};
