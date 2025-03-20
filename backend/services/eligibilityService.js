const logger = require('../utils/logger');

// Scoring weights for different factors
const SCORING_WEIGHTS = {
  age: 0.25,
  education: 0.3,
  workExperience: 0.25,
  financialCapacity: 0.2
};

// Country-specific requirements and thresholds
const COUNTRY_REQUIREMENTS = {
  canada: {
    minAge: 18,
    maxAge: 45,
    minEducation: 'bachelor',
    minWorkExperience: 3,
    minFinancialCapacity: 12500, // in CAD
    visaTypes: ['express-entry', 'provincial-nominee', 'study-permit', 'work-permit']
  },
  australia: {
    minAge: 18,
    maxAge: 45,
    minEducation: 'bachelor',
    minWorkExperience: 3,
    minFinancialCapacity: 20000, // in AUD
    visaTypes: ['skilled-independent', 'skilled-nominated', 'temporary-skill-shortage']
  },
  uk: {
    minAge: 18,
    maxAge: 50,
    minEducation: 'bachelor',
    minWorkExperience: 2,
    minFinancialCapacity: 15000, // in GBP
    visaTypes: ['skilled-worker', 'global-talent', 'student']
  }
};

// Education levels and their scores
const EDUCATION_SCORES = {
  'high-school': 60,
  'diploma': 70,
  'bachelor': 80,
  'master': 90,
  'phd': 100
};

class EligibilityService {
  calculateCountryScore(profile, country) {
    try {
      const requirements = COUNTRY_REQUIREMENTS[country.toLowerCase()];
      if (!requirements) {
        throw new Error(`Country ${country} not supported`);
      }

      // Calculate individual scores
      const ageScore = this.calculateAgeScore(profile.age, requirements);
      const educationScore = this.calculateEducationScore(profile.education);
      const workExperienceScore = this.calculateWorkExperienceScore(
        profile.workExperience,
        requirements
      );
      const financialScore = this.calculateFinancialScore(
        profile.financialCapacity,
        requirements
      );

      // Calculate weighted total score
      const totalScore = (
        ageScore * SCORING_WEIGHTS.age +
        educationScore * SCORING_WEIGHTS.education +
        workExperienceScore * SCORING_WEIGHTS.workExperience +
        financialScore * SCORING_WEIGHTS.financialCapacity
      );

      return {
        score: Math.round(totalScore),
        breakdown: {
          age: ageScore,
          education: educationScore,
          workExperience: workExperienceScore,
          financial: financialScore
        },
        eligibleVisaTypes: this.getEligibleVisaTypes(totalScore, requirements)
      };
    } catch (error) {
      logger.error({
        message: 'Error calculating country score',
        error: error.message,
        profile,
        country
      });
      throw error;
    }
  }

  calculateAgeScore(age, requirements) {
    if (age < requirements.minAge || age > requirements.maxAge) {
      return 0;
    }
    // Higher scores for ages in the middle of the range
    const range = requirements.maxAge - requirements.minAge;
    const midPoint = requirements.minAge + range / 2;
    const distance = Math.abs(age - midPoint);
    return 100 - (distance / range) * 100;
  }

  calculateEducationScore(education) {
    return EDUCATION_SCORES[education.toLowerCase()] || 0;
  }

  calculateWorkExperienceScore(years, requirements) {
    if (years < requirements.minWorkExperience) {
      return 0;
    }
    // Cap at 15 years for maximum score
    const cappedYears = Math.min(years, 15);
    return (cappedYears / 15) * 100;
  }

  calculateFinancialScore(capacity, requirements) {
    if (capacity < requirements.minFinancialCapacity) {
      return 0;
    }
    // Cap at 3 times the minimum for maximum score
    const maxCapacity = requirements.minFinancialCapacity * 3;
    const cappedCapacity = Math.min(capacity, maxCapacity);
    return (cappedCapacity / maxCapacity) * 100;
  }

  getEligibleVisaTypes(score, requirements) {
    // Recommend visa types based on total score
    if (score >= 80) {
      return requirements.visaTypes;
    } else if (score >= 60) {
      return requirements.visaTypes.filter(type =>
        !type.includes('independent') && !type.includes('global-talent')
      );
    }
    return ['study-permit', 'temporary-visa'];
  }

  generateDocumentChecklist(country, visaType) {
    const baseDocuments = [
      'Valid Passport',
      'Passport-size Photographs',
      'Proof of Financial Capacity',
      'Police Clearance Certificate'
    ];

    const educationDocuments = [
      'Educational Certificates',
      'Transcripts',
      'Course Completion Certificates'
    ];

    const workDocuments = [
      'Resume/CV',
      'Employment Letters',
      'Pay Stubs',
      'Tax Returns'
    ];

    const additionalDocuments = {
      'express-entry': [
        'Language Test Results',
        'Skills Assessment Report',
        'Provincial Nomination (if applicable)'
      ],
      'study-permit': [
        'Acceptance Letter from Institution',
        'Study Plan',
        'Language Test Results'
      ],
      'work-permit': [
        'Job Offer Letter',
        'Labor Market Impact Assessment',
        'Professional Certifications'
      ]
    };

    let checklist = [...baseDocuments];

    // Add education and work documents based on visa type
    if (!visaType.includes('visitor')) {
      checklist = [...checklist, ...educationDocuments, ...workDocuments];
    }

    // Add visa-specific documents
    if (additionalDocuments[visaType]) {
      checklist = [...checklist, ...additionalDocuments[visaType]];
    }

    // Add country-specific requirements
    const countrySpecific = this.getCountrySpecificRequirements(country, visaType);
    checklist = [...checklist, ...countrySpecific];

    return {
      visaType,
      country,
      documents: checklist,
      notes: this.getDocumentNotes(country, visaType)
    };
  }

  getCountrySpecificRequirements(country, visaType) {
    const countryRequirements = {
      canada: [
        'Biometrics',
        'Medical Examination Report',
        'IMM 5645 Family Information Form'
      ],
      australia: [
        'Form 80 Personal Particulars',
        'Health Insurance Evidence',
        'Skills Assessment (if applicable)'
      ],
      uk: [
        'TB Test Certificate',
        'Bank Statements (6 months)',
        'Appendix 2 Financial Requirement Form'
      ]
    };

    return countryRequirements[country.toLowerCase()] || [];
  }

  getDocumentNotes(country, visaType) {
    return [
      'All documents must be in English or officially translated',
      'Financial documents should not be older than 3 months',
      'Certificates must be notarized copies',
      'Electronic copies must be in color and high resolution'
    ];
  }
}

module.exports = new EligibilityService();