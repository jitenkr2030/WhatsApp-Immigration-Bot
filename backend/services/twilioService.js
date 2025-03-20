const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');

class TwilioService {
  constructor() {
    const { accountSid, authToken, phoneNumber } = config.twilio;
    
    if (!accountSid || !accountSid.startsWith('AC')) {
      throw new Error('Invalid Twilio Account SID. It must start with "AC"');
    }
    
    if (!authToken) {
      throw new Error('Twilio Auth Token is required');
    }
    
    if (!phoneNumber) {
      throw new Error('Twilio Phone Number is required');
    }
    
    this.client = twilio(accountSid, authToken);
    this.phoneNumber = phoneNumber;
  }

  async sendMessage(to, body, mediaUrl = null) {
    try {
      const messageOptions = {
        from: `whatsapp:${this.phoneNumber}`,
        to: `whatsapp:${to}`,
        body
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = [mediaUrl];
      }

      const message = await this.client.messages.create(messageOptions);

      logger.info({
        message: 'WhatsApp message sent successfully',
        to,
        messageId: message.sid
      });

      return message;
    } catch (error) {
      logger.error({
        message: 'Error sending WhatsApp message',
        error: error.message,
        to
      });
      throw error;
    }
  }

  async sendTemplate(to, templateName, variables = {}) {
    try {
      const message = await this.client.messages.create({
        from: `whatsapp:${this.phoneNumber}`,
        to: `whatsapp:${to}`,
        body: this.formatTemplate(templateName, variables)
      });

      logger.info({
        message: 'Template message sent successfully',
        to,
        template: templateName,
        messageId: message.sid
      });

      return message;
    } catch (error) {
      logger.error({
        message: 'Error sending template message',
        error: error.message,
        template: templateName,
        to
      });
      throw error;
    }
  }

  formatTemplate(templateName, variables) {
    // Template mapping
    const templates = {
      welcome: 'Welcome to Immigration Assistant! 🌍\nHow can I help you today?',
      documentRequest: 'Please upload the following documents:\n{{documents}}',
      visaStatus: 'Your visa application status: {{status}}\nNext steps: {{nextSteps}}',
      interviewPrep: 'Your interview is scheduled for {{date}}.\nHere are some preparation tips:\n{{tips}}'
    };

    let template = templates[templateName] || '';

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      template = template.replace(`{{${key}}}`, value);
    });

    return template;
  }

  validateWebhookSignature(signature, url, params) {
    try {
      const requestValid = twilio.validateRequest(
        config.twilio.authToken,
        signature,
        url,
        params
      );

      return requestValid;
    } catch (error) {
      logger.error({
        message: 'Error validating webhook signature',
        error: error.message
      });
      return false;
    }
  }

  parseIncomingMessage(body) {
    return {
      messageId: body.MessageSid,
      from: body.From.replace('whatsapp:', ''),
      body: body.Body,
      mediaUrl: body.MediaUrl0 || null,
      timestamp: new Date()
    };
  }
}

module.exports = new TwilioService();