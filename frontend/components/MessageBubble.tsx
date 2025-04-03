import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: {
    role: string
    content: string
  }
  isLastMessage?: boolean
}

const TypingIndicator = () => (
  <div className="typing-animation px-2">
    <span></span>
    <span></span>
    <span></span>
  </div>
)

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLastMessage }) => {
  const isUser = message.role === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2">
          <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      )}
      
      <div
        className={`chat-bubble ${
          isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
        }`}
      >
        {message.content === '[TYPING]' && isLastMessage ? (
          <TypingIndicator />
        ) : (
          <div className="chat-message">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default MessageBubble