const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

async function processDocuments(documentData) {
  try {
    // Extract document type and image data
    const { type, imageBuffer } = parseDocumentData(documentData);

    // Perform OCR on the image
    const extractedText = await performOCR(imageBuffer);

    // Validate document based on type
    const validationResult = validateDocument(type, extractedText);

    return formatResponse(validationResult);
  } catch (error) {
    logger.error({
      message: 'Error processing document',
      error: error.message,
      stack: error.stack
    });
    return 'Sorry, I encountered an error while processing your document. Please try again with a clearer image.';
  }
}

function parseDocumentData(documentData) {
  // Implementation for extracting document type and image data
  return {
    type: 'passport', // Example type
    imageBuffer: Buffer.from(documentData, 'base64')
  };
}

async function performOCR(imageBuffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'eng',
      {
        logger: progress => {
          logger.debug('OCR Progress:', progress);
        }
      }
    );
    return text;
  } catch (error) {
    logger.error('OCR failed:', error);
    throw new Error('Failed to perform OCR');
  }
}

function validateDocument(type, text) {
  const validationRules = {
    passport: {
      required: ['passport number', 'name', 'date of birth', 'expiry date'],
      format: /^[A-Z][0-9]{8}$/ // Example passport number format
    },
    certificate: {
      required: ['institution name', 'qualification', 'date'],
      keywords: ['university', 'college', 'degree', 'diploma']
    }
  };

  const rules = validationRules[type];
  if (!rules) {
    throw new Error(`Unsupported document type: ${type}`);
  }

  const validation = {
    isValid: false,
    missingFields: [],
    suggestions: []
  };

  // Check required fields
  rules.required.forEach(field => {
    if (!text.toLowerCase().includes(field.toLowerCase())) {
      validation.missingFields.push(field);
    }
  });

  validation.isValid = validation.missingFields.length === 0;

  return validation;
}

function formatResponse(validationResult) {
  if (validationResult.isValid) {
    return 'Document verification successful! ✅';
  }

  let response = 'Document verification failed. 🚫\n\n';
  if (validationResult.missingFields.length > 0) {
    response += 'Missing required information:\n';
    validationResult.missingFields.forEach(field => {
      response += `- ${field}\n`;
    });
  }

  if (validationResult.suggestions.length > 0) {
    response += '\nSuggestions:\n';
    validationResult.suggestions.forEach(suggestion => {
      response += `- ${suggestion}\n`;
    });
  }

  return response;
}

module.exports = {
  processDocuments
};