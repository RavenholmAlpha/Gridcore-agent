const WebSocket = require('ws');
const { processReport } = require('../services/agentService');
const url = require('url');

// Map to store active connections: uuid -> WebSocket
const clients = new Map();

/**
 * Send a command to a specific agent
 * @param {string} uuid - Agent UUID
 * @param {object} command - Command object (e.g. { type: 'exit' })
 */
const sendCommand = (uuid, command) => {
    const ws = clients.get(uuid);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(command));
        return true;
    }
    return false;
};

const initWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    // 1. Handle HTTP Upgrade (Auth)
    server.on('upgrade', (request, socket, head) => {
        // Debug Log for WebSocket Upgrade
        console.log('WS Upgrade Request:', request.url, request.headers['x-forwarded-proto']);

        const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

        if (pathname === '/api/agent/ws') {
            // Get auth info from headers
            const secret = request.headers['authorization']?.replace('Bearer ', '');
            const uuid = request.headers['x-agent-uuid'];

            if (!secret || !uuid) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(request, socket, head, (ws) => {
                ws.agentInfo = { uuid, secret, ip: request.socket.remoteAddress };
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // 2. Handle Connection
    wss.on('connection', (ws, req) => {
        const { uuid, secret, ip } = ws.agentInfo;
        console.log(`Agent connected: ${uuid}`);

        // Register client
        clients.set(uuid, ws);

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                // Reuse Service logic
                await processReport(uuid, secret, data, ip);
            } catch (error) {
                console.error(`Error processing msg from ${uuid}:`, error.message);
                // If auth failed, close connection
                if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
                    ws.close(4001, error.message);
                }
            }
        });

        ws.on('close', () => {
            console.log(`Agent disconnected: ${uuid}`);
            // Unregister client
            clients.delete(uuid);
        });

        // Heartbeat Ping
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            } else {
                clearInterval(pingInterval);
            }
        }, 30000);
    });

    return wss;
};

module.exports = { initWebSocket, sendCommand };
