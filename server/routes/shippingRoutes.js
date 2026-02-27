const express = require('express');
const router = express.Router();
const { nimbusWebhook, trackShipment } = require('../controllers/shippingController');
const { protect } = require('../middleware/authMiddleware');

// NimbusPost webhook — no auth (NimbusPost server calls this)
router.post('/webhook', nimbusWebhook);

// Track shipment by AWB — user must be logged in
router.get('/track/:awb', protect, trackShipment);

module.exports = router;
