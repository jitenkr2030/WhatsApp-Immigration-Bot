const stripe = require('stripe');
const logger = require('../utils/logger');
const config = require('../config');

class PaymentService {
  constructor() {
    this.stripe = stripe(config.stripe.secretKey);
  }

  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        payment_method_types: ['card']
      });

      logger.info({
        message: 'Payment intent created',
        amount,
        currency,
        paymentIntentId: paymentIntent.id
      });

      return paymentIntent;
    } catch (error) {
      logger.error({
        message: 'Error creating payment intent',
        error: error.message,
        amount,
        currency
      });
      throw error;
    }
  }

  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        verified: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      };
    } catch (error) {
      logger.error({
        message: 'Error verifying payment',
        error: error.message,
        paymentIntentId
      });
      throw error;
    }
  }

  async generateReceipt(paymentIntentId) {
    try {
      const payment = await this.verifyPayment(paymentIntentId);
      if (!payment.verified) {
        throw new Error('Cannot generate receipt for unverified payment');
      }

      const receipt = {
        receiptId: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentId: paymentIntentId,
        amount: payment.amount,
        currency: payment.currency,
        date: new Date().toISOString(),
        status: 'paid',
        metadata: payment.metadata
      };

      logger.info({
        message: 'Receipt generated',
        receiptId: receipt.receiptId,
        paymentIntentId
      });

      return receipt;
    } catch (error) {
      logger.error({
        message: 'Error generating receipt',
        error: error.message,
        paymentIntentId
      });
      throw error;
    }
  }

  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(event.data.object);
          break;
        default:
          logger.info({
            message: 'Unhandled webhook event',
            eventType: event.type
          });
      }
    } catch (error) {
      logger.error({
        message: 'Error handling webhook event',
        error: error.message,
        eventType: event.type
      });
      throw error;
    }
  }

  async handleSuccessfulPayment(paymentIntent) {
    try {
      // Generate receipt
      const receipt = await this.generateReceipt(paymentIntent.id);

      // Update booking or consultation status if applicable
      if (paymentIntent.metadata.bookingId) {
        // Update booking status logic here
      }

      return receipt;
    } catch (error) {
      logger.error({
        message: 'Error handling successful payment',
        error: error.message,
        paymentIntentId: paymentIntent.id
      });
      throw error;
    }
  }

  async handleFailedPayment(paymentIntent) {
    try {
      logger.warn({
        message: 'Payment failed',
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error
      });

      // Update booking or consultation status if applicable
      if (paymentIntent.metadata.bookingId) {
        // Update booking status logic here
      }

      return {
        status: 'failed',
        error: paymentIntent.last_payment_error?.message || 'Payment failed'
      };
    } catch (error) {
      logger.error({
        message: 'Error handling failed payment',
        error: error.message,
        paymentIntentId: paymentIntent.id
      });
      throw error;
    }
  }
}

module.exports = new PaymentService();