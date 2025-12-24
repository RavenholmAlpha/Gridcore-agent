const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Frontend APIs
router.get('/servers', apiController.getServers);
router.get('/servers/:id/metrics', apiController.getServerMetrics);
router.post('/nodes', apiController.createNode);

module.exports = router;
