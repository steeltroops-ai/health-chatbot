import React from 'react'
import { motion } from 'framer-motion'
import useChatStore from '../utils/chatStore'

const EmptyState: React.FC = () => {
  const { createNewChat } = useChatStore()

  const examples = [
    "I've been having a persistent headache for 3 days. What could it be?",
    "What type of specialist should I see for joint pain?",
    "What are some good habits for maintaining heart health?",
    "What are common symptoms of seasonal allergies?",
    "How do I know if I should go to the ER or urgent care?"
  ]

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div>
          <svg className="mx-auto h-16 w-16 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Medical Chatbot</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Get health information, symptom guidance, and specialist recommendations.
          </p>
        </div>

        <div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => createNewChat()}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Start New Chat
          </motion.button>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Try asking about:</h3>
          <div className="mt-3 grid gap-2">
            {examples.map((example, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.01 }}
                onClick={() => {
                  createNewChat(example)
                }}
                className="p-3 text-left text-sm bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
              >
                "{example}"
              </motion.button>
            ))}
          </div>
        </div>

        <div className="pt-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <p>Remember: This is not a substitute for professional medical advice.</p>
        </div>
      </motion.div>
    </div>
  )
}

export default EmptyState