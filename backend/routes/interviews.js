const express = require('express');
const router = express.Router();
const VoiceChatService = require('../services/voiceChatService');
const logger = require('../utils/logger');

// Initialize VoiceChatService
const voiceChatService = VoiceChatService.getInstance();

// Start a new mock interview session
router.post('/mock-interview', async (req, res) => {
  try {
    const { visaType, country, userProfile } = req.body;

    if (!visaType || !country || !userProfile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const interviewSession = await voiceChatService.conductMockInterview(
      userProfile,
      visaType,
      country
    );

    res.json({
      success: true,
      data: interviewSession
    });
  } catch (error) {
    logger.error({
      message: 'Error starting mock interview',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to start mock interview session'
    });
  }
});

// Submit and evaluate interview response
router.post('/evaluate-response', async (req, res) => {
  try {
    const { question, response, visaType } = req.body;

    if (!question || !response || !visaType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const evaluation = await voiceChatService.evaluateResponse(
      question,
      response,
      visaType
    );

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    logger.error({
      message: 'Error evaluating interview response',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate interview response'
    });
  }
});

// Get interview questions by visa type
router.get('/questions/:visaType', (req, res) => {
  try {
    const { visaType } = req.params;
    const questions = voiceChatService.questionTemplates[visaType];

    if (!questions) {
      return res.status(404).json({
        success: false,
        message: 'Questions not found for the specified visa type'
      });
    }

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    logger.error({
      message: 'Error fetching interview questions',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview questions'
    });
  }
});

module.exports = router;