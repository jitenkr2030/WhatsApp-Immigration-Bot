const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    const paymentIntent = await paymentService.createPaymentIntent(amount, currency, metadata);
    res.json(paymentIntent);
  } catch (error) {
    logger.error({
      message: 'Error creating payment intent',
      error: error.message
    });
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Verify payment status
router.get('/verify/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const verification = await paymentService.verifyPayment(paymentIntentId);
    res.json(verification);
  } catch (error) {
    logger.error({
      message: 'Error verifying payment',
      error: error.message
    });
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Generate receipt
router.get('/receipt/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const receipt = await paymentService.generateReceipt(paymentIntentId);
    res.json(receipt);
  } catch (error) {
    logger.error({
      message: 'Error generating receipt',
      error: error.message
    });
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

// Handle Stripe webhook events
router.post('/webhook', async (req, res) => {
  try {
    await paymentService.handleWebhookEvent(req.body);
    res.json({ received: true });
  } catch (error) {
    logger.error({
      message: 'Error handling webhook event',
      error: error.message
    });
    res.status(400).json({ error: 'Webhook error' });
  }
});

module.exports = router;