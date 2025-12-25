const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Frontend APIs
router.get('/servers', apiController.getServers);
router.get('/servers/:id/metrics', apiController.getServerMetrics);
router.post('/nodes', apiController.createNode);
router.delete('/nodes/:id', apiController.deleteNode);
router.put('/nodes/:id/remark', apiController.updateRemark);
router.post('/verify-secret', apiController.verifySecret);

module.exports = router;
