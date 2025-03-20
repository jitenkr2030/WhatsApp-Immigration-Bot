const { OpenAI } = require('openai');
const { ConversationChain } = require('langchain/chains');
const logger = require('../utils/logger');
const { processDocuments } = require('./documentProcessor');
const { calculateVisaCosts } = require('./visaCalculator');
const twilioService = require('./twilioService');
const visaApplicationService = require('./visaApplicationService');
const eligibilityService = require('./eligibilityService');
const languageService = require('./languageService');
const lawyerBookingService = require('./lawyerBookingService');
const voiceChatService = require('./voiceChatService');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize conversation states
const conversationStates = new Map();

// Define conversation stages
const STAGES = {
  INITIAL: 'initial',
  COLLECTING_INFO: 'collecting_info',
  DOCUMENT_VERIFICATION: 'document_verification',
  VISA_APPLICATION: 'visa_application',
  INTERVIEW_PREP: 'interview_prep',
  COST_CALCULATION: 'cost_calculation',
  LAWYER_BOOKING: 'lawyer_booking'
};

async function handleUserMessage(message, userPhoneNumber) {
  try {
    // Get or initialize user's conversation state
    let state = conversationStates.get(userPhoneNumber) || {
      stage: STAGES.INITIAL,
      userData: {},
      language: 'en' // Default language
    };

    // Detect message language and update user's preferred language
    const detectedLanguage = await languageService.detectLanguage(message);
    state.language = detectedLanguage;

    let response;

    // Process message based on current stage
    response = await processStageResponse(message, state);

    // Translate response to user's preferred language
    response = await languageService.localizeResponse(response, state.language);

    // Update conversation state
    conversationStates.set(userPhoneNumber, state);

    return response;

  } catch (error) {
    logger.error({
      message: 'Error in handleUserMessage',
      error: error.message,
      userPhoneNumber
    });
    return 'I apologize, but I encountered an error. Please try again.';
  }
}

async function processStageResponse(message, state, chain) {
  let response;
  
  switch (state.stage) {
    case STAGES.INITIAL:
      response = await handleInitialStage(message, state, chain);
      break;

    case STAGES.COLLECTING_INFO:
      response = await handleInfoCollection(message, state, chain);
      break;

    case STAGES.DOCUMENT_VERIFICATION:
      response = await handleDocumentVerification(message, state);
      break;

    case STAGES.VISA_APPLICATION:
      response = await handleVisaApplication(message, state, chain);
      break;

    case STAGES.INTERVIEW_PREP:
      response = await handleInterviewPrep(message, state);
      break;

    case STAGES.COST_CALCULATION:
      response = await handleCostCalculation(message, state);
      break;

    case STAGES.LAWYER_BOOKING:
      response = await handleLawyerBooking(message, state);
      break;

    default:
      response = "I'm sorry, I encountered an error with your session. Let's start over.";
      state.stage = STAGES.INITIAL;
  }

  return response;
}

async function handleInitialStage(message, state, chain) {
  const initialPrompt = `Welcome to the Immigration Assistant! 🌍\n\n`
    + `I'll help you with your immigration process. Let's start by gathering some information.\n\n`
    + `Please provide the following details:\n`
    + `1. Your age\n`
    + `2. Highest education level\n`
    + `3. Years of work experience\n`
    + `4. Preferred country for immigration\n`
    + `5. Current savings/financial capacity\n\n`
    + `You can provide these details one by one or all at once.`;

  state.stage = STAGES.COLLECTING_INFO;
  return initialPrompt;
}

async function handleInfoCollection(message, state, chain) {
  try {
    // Process user information using LangChain
    const response = await chain.call({
      input: `Process this immigration-related information: ${message}`
    });

    // Update user data based on the message content
    const userInfo = extractUserInfo(message);
    state.userData = { ...state.userData, ...userInfo };

    // Check if we have all required information
    const requiredFields = ['age', 'education', 'workExperience', 'preferredCountry', 'financialCapacity'];
    const missingFields = requiredFields.filter(field => !state.userData[field]);

    if (missingFields.length === 0) {
      // Calculate eligibility scores for the preferred country
      const eligibilityService = require('./eligibilityService');
      const eligibilityResult = eligibilityService.calculateCountryScore(
        state.userData,
        state.userData.preferredCountry
      );

      // Generate document checklist based on eligible visa types
      const checklist = eligibilityService.generateDocumentChecklist(
        state.userData.preferredCountry,
        eligibilityResult.eligibleVisaTypes[0]
      );

      // Format the response with eligibility results and document checklist
      const formattedResponse = formatEligibilityResponse(eligibilityResult, checklist);
      state.stage = STAGES.DOCUMENT_VERIFICATION;
      return formattedResponse;
    }

    return `Please provide the following information:\n${missingFields.join('\n')}\n\nCurrent information:\n${formatUserInfo(state.userData)}`;
  } catch (error) {
    logger.error({
      message: 'Error in handleInfoCollection',
      error: error.message,
      userData: state.userData
    });
    return 'I encountered an error while processing your information. Please try again.';
  }
}

async function handleDocumentVerification(message, state) {
  try {
    // Get the document checklist for reference
    const eligibilityService = require('./eligibilityService');
    const checklist = eligibilityService.generateDocumentChecklist(
      state.userData.preferredCountry,
      state.userData.visaType || 'general'
    );

    // Process and verify the uploaded document
    const verificationResult = await processDocuments(message);

    // Update the list of verified documents
    state.userData.verifiedDocuments = state.userData.verifiedDocuments || [];
    if (verificationResult.isValid) {
      state.userData.verifiedDocuments.push(verificationResult.documentType);
    }

    // Check remaining required documents
    const remainingDocuments = checklist.documents.filter(
      doc => !state.userData.verifiedDocuments.includes(doc)
    );

    if (remainingDocuments.length === 0) {
      state.stage = STAGES.VISA_APPLICATION;
      return 'All required documents have been verified! We can now proceed with your visa application.';
    }

    return `Document verification status:\n${verificationResult.message}\n\nRemaining required documents:\n${remainingDocuments.join('\n')}`;
  } catch (error) {
    logger.error({
      message: 'Error in handleDocumentVerification',
      error: error.message,
      userData: state.userData
    });
    return 'I encountered an error while verifying your document. Please try again.';
  }
}

async function handleVisaApplication(message, state, chain) {
  try {
    const visaApplicationService = require('./visaApplicationService');
    const voiceChatService = require('./voiceChatService');

    // Generate cover letter
    const coverLetter = await visaApplicationService.generateCoverLetter(
      state.userData,
      state.userData.visaType,
      state.userData.preferredCountry
    );

    // Auto-fill visa application form
    const filledForm = await visaApplicationService.autoFillForm(
      state.userData,
      state.userData.visaType
    );

    // Submit to embassy portal if configured
    const portalConfig = {
      portalUrl: process.env.EMBASSY_PORTAL_URL,
      apiKey: process.env.EMBASSY_API_KEY,
      submissionEndpoint: '/applications/submit'
    };

    const submissionResult = await visaApplicationService.submitToPortal(filledForm, portalConfig);

    // Set up mock interview
    const interviewSession = await voiceChatService.conductMockInterview(
      state.userData,
      state.userData.visaType,
      state.userData.preferredCountry
    );

    // Update state
    state.stage = STAGES.INTERVIEW_PREP;
    state.interviewSession = interviewSession;

    return `Your visa application has been processed! 📝\n\n`
      + `Cover Letter: Generated ✅\n`
      + `Application Form: Completed ✅\n`
      + `Portal Submission: ${submissionResult.success ? '✅' : '❌'}\n\n`
      + `Next Step: Interview Preparation\n`
      + `I've prepared some interview questions for you. Would you like to start the mock interview?`;

  } catch (error) {
    logger.error({
      message: 'Error in visa application process',
      error: error.message,
      userData: state.userData
    });
    return 'I encountered an error while processing your visa application. Please try again.';
  }
}

async function handleInterviewPrep(message, state) {
  // Implement interview preparation logic
  return await conductMockInterview(message, state.userData);
}

async function handleCostCalculation(message, state) {
  // Calculate visa costs and processing times
  return await calculateVisaCosts(state.userData);
}

async function handleLawyerBooking(message, state) {
  // Implement lawyer booking system
  return 'Lawyer booking implementation';
}

module.exports = {
  handleUserMessage
};