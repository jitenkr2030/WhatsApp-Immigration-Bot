const express = require('express');
const router = express.Router();
const { MessagingResponse } = require('twilio').twiml;
const { handleUserMessage } = require('../services/messageHandler');
const { validateWebhook } = require('../middleware/validateWebhook');
const logger = require('../utils/logger');

// Validate incoming requests are from Twilio
router.use(validateWebhook);

// Handle incoming WhatsApp messages
router.post('/', async (req, res) => {
  try {
    const { Body: userMessage, From: userPhoneNumber } = req.body;
    const twiml = new MessagingResponse();

    // Process the user's message and get the response
    const botResponse = await handleUserMessage(userMessage, userPhoneNumber);

    // Send the response back to WhatsApp
    twiml.message(botResponse);

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

    logger.info({
      message: 'Successfully processed WhatsApp message',
      from: userPhoneNumber,
      userMessage,
      botResponse
    });
  } catch (error) {
    logger.error({
      message: 'Error processing WhatsApp message',
      error: error.message,
      stack: error.stack
    });

    const twiml = new MessagingResponse();
    twiml.message('Sorry, I encountered an error. Please try again later.');

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

module.exports = router;