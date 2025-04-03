import type { NextPage } from 'next'
import Head from 'next/head'
import { motion } from 'framer-motion'

const About: NextPage = () => {
  return (
    <div>
      <Head>
        <title>About | Medical Chatbot</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
        >
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">About Medical Chatbot</h1>
            
            <div className="mt-6 space-y-6 text-gray-500 dark:text-gray-400">
              <p>
                Medical Chatbot is an AI-powered application designed to provide general health information and guidance. 
                Our mission is to make basic medical information more accessible while ensuring users understand the 
                limitations of AI-based health advice.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">What Medical Chatbot Can Do</h2>
              
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide information about general health topics</li>
                <li>Analyze symptoms and suggest possible causes</li>
                <li>Recommend appropriate medical specialists</li>
                <li>Explain medical terms and conditions</li>
                <li>Offer general preventive healthcare advice</li>
              </ul>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Important Limitations</h2>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Disclaimer</h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Medical Chatbot is <strong>NOT</strong> a replacement for professional medical advice, diagnosis, or treatment.</li>
                        <li>Always consult with qualified healthcare providers for medical concerns.</li>
                        <li>Medical Chatbot cannot and does not provide diagnoses.</li>
                        <li>In case of emergency, call your local emergency services immediately.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Technology</h2>
              
              <p>
                Medical Chatbot uses state-of-the-art AI technology from OpenAI to provide responses. The application 
                is built with a Flask backend and Next.js frontend, ensuring a responsive and user-friendly experience.
                All interactions are secured with encryption and authentication.
              </p>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Privacy</h2>
              
              <p>
                We take your privacy seriously. Chat histories are stored securely and are only accessible to you.
                Your data is never sold to third parties. You can delete your chat history at any time.
              </p>
              
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} Medical Chatbot. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default About