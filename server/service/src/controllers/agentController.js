const { Server, Metric } = require('../models');

const report = async (req, res) => {
  try {
    const { uuid, name, os, cpu, ram, disk, net_in, net_out, uptime } = req.body;
    const clientIp = req.ip;

    if (!uuid) {
      return res.status(400).json({ code: 400, message: 'UUID is required' });
    }

    // Find or create server
    let [server, created] = await Server.findOrCreate({
      where: { uuid },
      defaults: {
        name: name || uuid,
        os_info: os,
        status: 1,
        last_seen: new Date(),
        client_ip: clientIp,
      }
    });

    // Update server info
    await server.update({
      name: name || server.name,
      os_info: os,
      status: 1,
      last_seen: new Date(),
      client_ip: clientIp,
    });

    // Save metrics
    await Metric.create({
      server_id: server.id,
      cpu_usage: cpu,
      ram_usage: ram,
      disk_usage: disk,
      net_in_rate: net_in,
      net_out_rate: net_out,
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
