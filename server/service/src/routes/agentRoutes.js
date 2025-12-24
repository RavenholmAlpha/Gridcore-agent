const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middlewares/auth');

// Agent reporting endpoint
router.post('/report', agentController.report);

module.exports = router;
