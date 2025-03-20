const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const config = require('../config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class VisaCostCalculator {
  constructor() {
    this.baseFees = {
      student: 160,
      work: 190,
      tourist: 140,
      business: 250
    };
  }

  async calculateVisaCosts(userData) {
    try {
      const { visaType, country, duration } = userData;
      
      // Calculate base costs
      const costs = {
        visaFee: this.calculateVisaFee(visaType),
        processingFee: this.calculateProcessingFee(country),
        serviceFee: this.calculateServiceFee(visaType),
        documentationCost: this.calculateDocumentationCost(userData),
        travelCost: await this.estimateTravelCost(userData),
        legalFees: this.calculateLegalFees(visaType)
      };

      // Calculate total cost
      const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

      // Get processing time estimate
      const processingTime = await this.estimateProcessingTime(userData);

      return this.formatCostBreakdown(costs, totalCost, processingTime);
    } catch (error) {
      logger.error({
        message: 'Error calculating visa costs',
        error: error.message,
        userData
      });
      throw error;
    }
  }

  calculateVisaFee(visaType) {
    return this.baseFees[visaType.toLowerCase()] || 200;
  }

  calculateProcessingFee(country) {
    const processingFees = {
      USA: 100,
      UK: 120,
      Canada: 85,
      Australia: 95
    };
    return processingFees[country] || 100;
  }

  calculateServiceFee(visaType) {
    const serviceFees = {
      student: 50,
      work: 75,
      tourist: 40,
      business: 100
    };
    return serviceFees[visaType.toLowerCase()] || 60;
  }

  calculateDocumentationCost(userData) {
    // Base cost for document preparation
    let cost = 100;

    // Additional costs based on required documents
    if (userData.requiresTranslation) cost += 50;
    if (userData.requiresNotarization) cost += 30;
    if (userData.requiresApostille) cost += 80;

    return cost;
  }

  async estimateTravelCost(userData) {
    // This would typically integrate with a travel cost API
    // For now, using simplified calculation
    const baseCost = 500; // Base cost for travel
    const countryMultiplier = {
      USA: 1.5,
      UK: 1.3,
      Canada: 1.2,
      Australia: 1.4
    };

    return baseCost * (countryMultiplier[userData.country] || 1);
  }

  calculateLegalFees(visaType) {
    const legalFees = {
      student: 200,
      work: 500,
      tourist: 150,
      business: 800
    };
    return legalFees[visaType.toLowerCase()] || 300;
  }

  async estimateProcessingTime(userData) {
    try {
      const prompt = `Estimate visa processing time for:
      Country: ${userData.country}
      Visa Type: ${userData.visaType}
      Season: ${this.getCurrentSeason()}
      
      Consider current processing trends and seasonal factors.
      Return estimate in weeks.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 100
      });

      const weeks = this.extractWeeksFromResponse(response.choices[0].message.content);
      return {
        estimatedWeeks: weeks,
        confidence: this.calculateConfidence(weeks)
      };
    } catch (error) {
      logger.error('Error estimating processing time:', error);
      return { estimatedWeeks: 8, confidence: 'medium' }; // Fallback estimate
    }
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  extractWeeksFromResponse(response) {
    const match = response.match(/\d+/);
    return match ? parseInt(match[0]) : 8;
  }

  calculateConfidence(weeks) {
    if (weeks <= 4) return 'high';
    if (weeks <= 8) return 'medium';
    return 'low';
  }

  formatCostBreakdown(costs, totalCost, processingTime) {
    return {
      breakdown: {
        'Visa Application Fee': `$${costs.visaFee}`,
        'Processing Fee': `$${costs.processingFee}`,
        'Service Fee': `$${costs.serviceFee}`,
        'Documentation Costs': `$${costs.documentationCost}`,
        'Estimated Travel Costs': `$${costs.travelCost}`,
        'Legal Consultation Fees': `$${costs.legalFees}`
      },
      totalCost: `$${totalCost}`,
      processingTime: {
        estimated: `${processingTime.estimatedWeeks} weeks`,
        confidence: processingTime.confidence
      },
      note: 'Costs are estimates and may vary based on individual circumstances and embassy requirements.'
    };
  }
}

module.exports = new VisaCostCalculator();