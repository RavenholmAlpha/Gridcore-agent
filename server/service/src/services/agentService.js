const { Server, Metric } = require('../models');

/**
 * Process agent report data
 * @param {string} uuid - Agent UUID
 * @param {string} secret - Agent Secret (for auth)
 * @param {object} data - Report data
 * @param {string} clientIp - Client IP
 */
const processReport = async (uuid, secret, data, clientIp) => {
    // 1. Find server
    const server = await Server.findOne({ where: { uuid } });
    if (!server) {
        throw new Error('Forbidden: Node not registered');
    }

    // 2. Verify Secret
    if (server.secret !== secret) {
        throw new Error('Unauthorized: Invalid secret');
    }

    // 3. Update server info
    await server.update({
        name: data.name || server.name,
        os_info: data.os || server.os_info,
        status: 1,
        last_seen: new Date(),
        client_ip: data.public_ip || clientIp,
        uptime: data.uptime,
    });

    // 4. Save metrics
    await Metric.create({
        server_id: server.id,
        cpu_usage: data.cpu,
        ram_usage: data.ram,
        disk_usage: data.disk,
        net_in_rate: data.net_in,
        net_out_rate: data.net_out,
        load_1: data.load_1,
        load_5: data.load_5,
        load_15: data.load_15,
    });

    return { success: true };
};

module.exports = { processReport };
