'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
  >
    <div className="flex items-center mb-4">
      <div className="bg-blue-100 rounded-full p-3 mr-4">
        <Image src={icon} alt={title} width={24} height={24} />
      </div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const features = [
  {
    icon: '/globe.svg',
    title: 'Smart Onboarding',
    description: 'Personalized immigration guidance based on your profile, preferences, and destination country.'
  },
  {
    icon: '/file.svg',
    title: 'Document Verification',
    description: 'Automated document checking and validation to ensure compliance with visa requirements.'
  },
  {
    icon: '/window.svg',
    title: 'Visa Application',
    description: 'Streamlined visa application process with auto-form filling and cover letter generation.'
  },
  {
    icon: '/globe.svg',
    title: 'Interview Preparation',
    description: 'AI-powered mock interviews with real-time feedback and performance evaluation.'
  },
  {
    icon: '/file.svg',
    title: 'Cost Estimation',
    description: 'Accurate calculation of visa fees, processing costs, and related expenses.'
  },
  {
    icon: '/window.svg',
    title: 'Legal Consultation',
    description: 'Easy booking of consultations with immigration lawyers for expert advice.'
  }
];

export default function Features() {
  const [activeDemo, setActiveDemo] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl"
          >
            WhatsApp Immigration Bot
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4"
          >
            Streamline your immigration process with our AI-powered WhatsApp bot
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <a
            href="https://wa.me/your-whatsapp-number"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
          >
            Try Bot Now
            <svg
              className="ml-2 -mr-1 w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </div>
  );
}