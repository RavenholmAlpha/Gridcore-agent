const { Server, Metric } = require('../models');

const report = async (req, res) => {
  try {
    const { uuid, name, os, cpu, ram, disk, net_in, net_out, uptime, load_1, load_5, load_15 } = req.body;
    const clientIp = req.ip;

    if (!uuid) {
      return res.status(400).json({ code: 400, message: 'UUID is required' });
    }

    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    // Find server
    const server = await Server.findOne({ where: { uuid } });

    // Strict Mode: Node must be registered
    if (!server) {
      return res.status(403).json({ code: 403, message: 'Forbidden: Node not registered' });
    }

    // Verify Secret
    if (server.secret !== token) {
      return res.status(401).json({ code: 401, message: 'Unauthorized: Invalid secret' });
    }

    // Update server info
    await server.update({
      name: name || server.name,
      os_info: os || server.os_info,
      status: 1,
      last_seen: new Date(),
      client_ip: clientIp,
      uptime: uptime,
    });

    // Save metrics
    await Metric.create({
      server_id: server.id,
      cpu_usage: cpu,
      ram_usage: ram,
      disk_usage: disk,
      net_in_rate: net_in,
      net_out_rate: net_out,
      load_1: load_1,
      load_5: load_5,
      load_15: load_15,
    });

    return res.json({ code: 200, message: 'success' });
  } catch (error) {
    console.error('Report error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

module.exports = {
  report,
};
