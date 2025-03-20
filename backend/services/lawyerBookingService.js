const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey);

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class LawyerBookingService {
  constructor() {
    this.consultationFees = {
      initial: 150,
      followUp: 100,
      documentReview: 200,
      comprehensive: 500
    };
    
    this.availableTimeSlots = {
      morning: ['09:00', '10:00', '11:00'],
      afternoon: ['14:00', '15:00', '16:00'],
      evening: ['17:00', '18:00']
    };
  }

  async scheduleConsultation(userData) {
    try {
      const { consultationType, preferredDate, preferredTime, visaType } = userData;
      
      // Validate consultation type and time slot
      if (!this.consultationFees[consultationType]) {
        throw new Error('Invalid consultation type');
      }

      // Check availability
      const isAvailable = await this.checkAvailability(preferredDate, preferredTime);
      if (!isAvailable) {
        return {
          success: false,
          message: 'Selected time slot is not available',
          alternativeSlots: await this.getAlternativeSlots(preferredDate)
        };
      }

      // Generate payment intent
      const paymentIntent = await this.createPaymentIntent(consultationType);

      // Create booking record
      const booking = await this.createBooking({
        ...userData,
        paymentIntentId: paymentIntent.id,
        amount: this.consultationFees[consultationType]
      });

      return {
        success: true,
        booking,
        paymentIntent: paymentIntent.client_secret
      };
    } catch (error) {
      logger.error({
        message: 'Error scheduling consultation',
        error: error.message,
        userData
      });
      throw error;
    }
  }

  async generateLegalAdvice(userData) {
    try {
      const prompt = `Generate legal advice for:
      Visa Type: ${userData.visaType}
      Country: ${userData.country}
      Specific Concerns: ${userData.concerns}
      
      Provide specific, actionable legal advice considering the applicant's situation.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      return this.formatLegalAdvice(response.choices[0].message.content);
    } catch (error) {
      logger.error({
        message: 'Error generating legal advice',
        error: error.message,
        userData
      });
      throw error;
    }
  }

  async checkAvailability(date, time) {
    // This would typically check against a database of bookings
    // For now, returning a simulated response
    return Math.random() > 0.3; // 70% chance of availability
  }

  async getAlternativeSlots(date) {
    // Return available time slots for the given date
    return Object.values(this.availableTimeSlots).flat()
      .filter(() => Math.random() > 0.5); // Randomly filter slots
  }

  async createPaymentIntent(consultationType) {
    const amount = this.consultationFees[consultationType];
    
    return await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        consultationType
      }
    });
  }

  async createBooking(bookingData) {
    // This would typically save to a database
    // For now, returning a formatted booking object
    return {
      bookingId: `BK${Date.now()}`,
      ...bookingData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }

  formatLegalAdvice(content) {
    const sections = content.split('\n\n');
    return {
      summary: sections[0],
      recommendations: sections.slice(1).map(section => ({
        title: section.split(':')[0],
        details: section.split(':')[1]?.trim() || section
      })),
      disclaimer: 'This automated legal advice is for informational purposes only and should not be considered as a substitute for professional legal counsel.'
    };
  }

  getConsultationFees() {
    return this.consultationFees;
  }
}

module.exports = new LawyerBookingService();