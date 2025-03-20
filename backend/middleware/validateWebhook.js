const twilioService = require('../services/twilioService');

const validateWebhook = (req, res, next) => {
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = req.protocol + '://' + req.get('host') + req.originalUrl;

  if (!twilioSignature) {
    return res.status(403).json({ error: 'No signature header found' });
  }

  const isValid = twilioService.validateWebhookSignature(
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
};

module.exports = { validateWebhook };