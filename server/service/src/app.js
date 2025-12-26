const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const { Op } = require('sequelize');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading .env from:', envPath);
require('dotenv').config({ path: envPath, quiet: true });

const { initDB, Server, Metric } = require('./models');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
console.log('Loaded SECRET:', process.env.SECRET ? '******' : 'NOT FOUND');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);

// Fallback for SPA (Frontend)
app.get(/.*/, (req, res) => {
  // If request is not API, serve index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ message: 'Not Found' });
  }
});

// Cron Jobs
const startCronJobs = () => {
  // 1. Offline Detection: Run every 10 seconds
  schedule.scheduleJob('*/10 * * * * *', async () => {
    try {
      const threshold = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      await Server.update(
        { status: 0 },
        {
          where: {
            last_seen: { [Op.lt]: threshold },
            status: 1,
          },
        }
      );
      // console.log('Offline check completed');
    } catch (error) {
      console.error('Offline check error:', error);
    }
  });

  // 2. Data Cleanup: Run every day at 00:00
  schedule.scheduleJob('0 0 * * *', async () => {
    try {
      const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const deleted = await Metric.destroy({
        where: {
          createdAt: { [Op.lt]: threshold },
        },
      });
      console.log(`Cleaned up ${deleted} old metric records.`);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
};

const http = require('http');
const { initWebSocket } = require('./websocket');

const server = http.createServer(app);

// Start Server
const startServer = async () => {
  await initDB();
  startCronJobs();

  // Initialize WebSocket
  initWebSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Gridcore Server running on port ${PORT}`);
  });
};

startServer();
