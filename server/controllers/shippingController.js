const axios = require('axios');
const Order = require('../models/Order');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    NimbusPost Webhook — auto-update delivery status
// @route   POST /api/shipping/webhook
// @access  Public (NimbusPost server only — validate token)
// ─────────────────────────────────────────────────────────────────────────────
const nimbusWebhook = async (req, res) => {
    try {
        // NimbusPost sends a token in headers or body — validate it
        const incomingToken = req.headers['x-nimbuspost-token'] || req.body?.token;
        if (incomingToken && incomingToken !== process.env.NIMBUSPOST_TOKEN) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { awb_code, status, remark } = req.body;
        if (!awb_code) return res.status(400).json({ message: 'AWB code missing' });

        // Find order by AWB code
        const order = await Order.findOne({ 'shippingInfo.awbCode': awb_code });
        if (!order) {
            return res.status(404).json({ message: `No order found for AWB: ${awb_code}` });
        }

        // Map NimbusPost status to our status enum
        const statusMap = {
            'PICKUP_PENDING': 'Packed',
            'PICKUP_DONE': 'Shipped',
            'IN_TRANSIT': 'Shipped',
            'OUT_FOR_DELIVERY': 'Out for Delivery',
            'DELIVERED': 'Delivered',
            'DELIVERY_FAILED': 'Shipped',
            'CANCELLED': 'Cancelled',
            'RETURNED': 'Cancelled',
        };

        const mappedStatus = statusMap[status?.toUpperCase()] || order.orderStatus;

        order.shippingInfo.lastStatus = status || '';
        order.shippingInfo.lastUpdated = new Date();
        order.orderStatus = mappedStatus;

        await order.save();

        console.log(`Webhook: Order ${order._id} — AWB ${awb_code} → ${mappedStatus}`);
        res.status(200).json({ message: 'Status updated' });
    } catch (error) {
        console.error('nimbusWebhook error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Track shipment by AWB code
// @route   GET /api/shipping/track/:awb
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const trackShipment = async (req, res) => {
    try {
        const { awb } = req.params;
        const token = process.env.NIMBUSPOST_TOKEN;

        const response = await axios.get(
            `https://api.nimbuspost.com/v1/shipments/track/${awb}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('trackShipment error:', error?.response?.data || error.message);
        res.status(500).json({ message: 'Tracking failed', error: error?.response?.data || error.message });
    }
};

module.exports = { nimbusWebhook, trackShipment };
