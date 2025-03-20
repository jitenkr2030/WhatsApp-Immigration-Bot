const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const config = require('../config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class VisaApplicationService {
  constructor() {
    this.formTemplates = {
      student: require('../templates/student-visa-form.json'),
      work: require('../templates/work-visa-form.json'),
      tourist: require('../templates/tourist-visa-form.json')
    };
  }

  async generateCoverLetter(userData, visaType, country) {
    try {
      const prompt = `Generate a professional visa cover letter for a ${visaType} visa application to ${country}.
      Applicant Details:
      - Age: ${userData.age}
      - Education: ${userData.education}
      - Work Experience: ${userData.workExperience} years
      - Financial Capacity: ${userData.financialCapacity}
      Make it formal, persuasive, and highlight the applicant's qualifications.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error({
        message: 'Error generating cover letter',
        error: error.message,
        userData: { visaType, country }
      });
      throw error;
    }
  }

  async autoFillForm(userData, visaType) {
    try {
      const template = this.formTemplates[visaType.toLowerCase()];
      if (!template) {
        throw new Error(`No template found for visa type: ${visaType}`);
      }

      const filledForm = {
        ...template,
        personalInfo: {
          fullName: userData.name,
          dateOfBirth: userData.dateOfBirth,
          nationality: userData.nationality,
          passportNumber: userData.passportNumber,
          currentAddress: userData.address
        },
        educationInfo: {
          highestQualification: userData.education,
          institution: userData.institution,
          graduationYear: userData.graduationYear
        },
        professionalInfo: {
          occupation: userData.occupation,
          workExperience: userData.workExperience,
          currentEmployer: userData.employer
        },
        financialInfo: {
          annualIncome: userData.income,
          bankBalance: userData.financialCapacity
        }
      };

      return filledForm;
    } catch (error) {
      logger.error({
        message: 'Error auto-filling visa form',
        error: error.message,
        userData: { visaType }
      });
      throw error;
    }
  }

  async submitToPortal(formData, portalConfig) {
    try {
      // Implement portal-specific submission logic
      const { portalUrl, apiKey, submissionEndpoint } = portalConfig;

      // Add portal submission implementation here
      // This would vary based on the specific embassy portal's API

      return {
        success: true,
        submissionId: 'SUBMISSION_ID',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({
        message: 'Error submitting to portal',
        error: error.message,
        portalConfig: { url: portalConfig.portalUrl }
      });
      throw error;
    }
  }
}

module.exports = new VisaApplicationService();