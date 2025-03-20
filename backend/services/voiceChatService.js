const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const config = require('../config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class VoiceChatService {
  static #instance = null;

  static getInstance() {
    if (!VoiceChatService.#instance) {
      VoiceChatService.#instance = new VoiceChatService();
    }
    return VoiceChatService.#instance;
  }
  constructor() {
    this.questionTemplates = {
      student: require('../templates/student-interview-questions.json'),
      work: require('../templates/work-interview-questions.json'),
      tourist: require('../templates/tourist-interview-questions.json')
    };
  }

  async generateDynamicQuestions(visaType, country, userProfile) {
    try {
      const prompt = `Generate 5 specific interview questions for a ${visaType} visa application to ${country}.
      Consider the applicant's profile:
      - Education: ${userProfile.education}
      - Work Experience: ${userProfile.workExperience} years
      - Purpose: ${userProfile.purpose}
      Make questions relevant to their background and visa category.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500
      });

      return this.parseQuestions(response.choices[0].message.content);
    } catch (error) {
      logger.error({
        message: 'Error generating interview questions',
        error: error.message,
        visaType,
        country
      });
      throw error;
    }
  }

  async evaluateResponse(question, response, visaType) {
    try {
      const prompt = `Evaluate this visa interview response.
      Question: ${question}
      Response: ${response}
      Visa Type: ${visaType}
      
      Provide a rating from 1-10 and specific feedback on:
      1. Relevance to question
      2. Clarity and articulation
      3. Confidence and authenticity
      4. Red flags or concerns
      5. Improvement suggestions`;

      const evaluation = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      return this.parseEvaluation(evaluation.choices[0].message.content);
    } catch (error) {
      logger.error({
        message: 'Error evaluating interview response',
        error: error.message,
        question
      });
      throw error;
    }
  }

  async conductMockInterview(userProfile, visaType, country) {
    try {
      const questions = await this.generateDynamicQuestions(visaType, country, userProfile);
      return {
        questions,
        instructions: 'Please respond to each question clearly and concisely. Your responses will be evaluated for content and delivery.',
        sessionId: this.generateSessionId()
      };
    } catch (error) {
      logger.error({
        message: 'Error setting up mock interview',
        error: error.message,
        userProfile: { visaType, country }
      });
      throw error;
    }
  }

  parseQuestions(content) {
    // Convert the generated content into structured questions
    const questions = content.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    return questions;
  }

  parseEvaluation(content) {
    // Parse the evaluation response into structured feedback
    return {
      rating: this.extractRating(content),
      feedback: this.extractFeedback(content),
      suggestions: this.extractSuggestions(content)
    };
  }

  extractRating(content) {
    const ratingMatch = content.match(/\b([0-9]|10)(\/10)?\b/);
    return ratingMatch ? parseInt(ratingMatch[1]) : null;
  }

  extractFeedback(content) {
    // Extract structured feedback points
    const feedbackPoints = content
      .split('\n')
      .filter(line => line.includes(':'))
      .map(line => {
        const [category, feedback] = line.split(':').map(s => s.trim());
        return { category, feedback };
      });
    return feedbackPoints;
  }

  extractSuggestions(content) {
    // Extract improvement suggestions
    const suggestions = content
      .split('\n')
      .filter(line => line.toLowerCase().includes('suggestion'))
      .map(line => line.replace(/^[^:]+:\s*/, '').trim());
    return suggestions;
  }

  generateSessionId() {
    return `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = VoiceChatService;