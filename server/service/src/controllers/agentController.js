const { processReport } = require('../services/agentService');

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

    await processReport(uuid, token, req.body, clientIp);

    return res.json({ code: 200, message: 'success' });
  } catch (error) {
    console.error('Report error:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(401).json({ code: 401, message: error.message });
    }
    if (error.message.includes('Forbidden')) {
      return res.status(403).json({ code: 403, message: error.message });
    }
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

module.exports = {
  report,
};
