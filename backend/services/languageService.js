const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const config = require('../config');

const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

class LanguageService {
  constructor() {
    this.supportedLanguages = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      zh: 'Chinese',
      hi: 'Hindi',
      ar: 'Arabic'
    };

    this.defaultLanguage = 'en';
  }

  async detectLanguage(text) {
    try {
      const prompt = `Detect the language of the following text and return only the ISO 639-1 language code:\n${text}`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 10
      });

      const languageCode = response.choices[0].message.content.trim().toLowerCase();
      return this.supportedLanguages[languageCode] ? languageCode : this.defaultLanguage;
    } catch (error) {
      logger.error({
        message: 'Error detecting language',
        error: error.message,
        text: text.substring(0, 100) // Log only first 100 chars for privacy
      });
      return this.defaultLanguage;
    }
  }

  async translateText(text, targetLanguage) {
    try {
      if (!this.supportedLanguages[targetLanguage]) {
        throw new Error(`Unsupported target language: ${targetLanguage}`);
      }

      const prompt = `Translate the following text to ${this.supportedLanguages[targetLanguage]}:\n${text}`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error({
        message: 'Error translating text',
        error: error.message,
        targetLanguage,
        text: text.substring(0, 100)
      });
      throw error;
    }
  }

  async localizeResponse(response, userLanguage) {
    try {
      const detectedLanguage = await this.detectLanguage(response);
      
      if (detectedLanguage === userLanguage) {
        return response;
      }

      return await this.translateText(response, userLanguage);
    } catch (error) {
      logger.error({
        message: 'Error localizing response',
        error: error.message,
        userLanguage
      });
      return response; // Fallback to original response
    }
  }

  getAvailableLanguages() {
    return this.supportedLanguages;
  }

  isLanguageSupported(languageCode) {
    return Boolean(this.supportedLanguages[languageCode]);
  }
}

module.exports = new LanguageService();