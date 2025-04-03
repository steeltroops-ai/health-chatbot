import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import useChatStore from '../utils/chatStore'
import { format } from 'date-fns'

interface SidebarProps {
  onCloseSidebar?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onCloseSidebar }) => {
  const router = useRouter()
  const { 
    sessions, 
    activeChatId, 
    setActiveChatId, 
    createNewChat, 
    deleteChat, 
    isLoading 
  } = useChatStore()

  const handleNewChat = () => {
    createNewChat()
    if (onCloseSidebar) onCloseSidebar()
  }

  const handleSelectChat = (sessionId: string) => {
    setActiveChatId(sessionId)
    if (onCloseSidebar) onCloseSidebar()
  }

  const handleDeleteChat = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChat(sessionId)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Sidebar header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Chats</h2>
        {onCloseSidebar && (
          <button 
            onClick={onCloseSidebar}
            className="text-gray-400 hover:text-gray-500 md:hidden"
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* New chat button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Chat
        </motion.button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            No chats yet. Start a new chat!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <li key={session.id}>
                <motion.div
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  onClick={() => handleSelectChat(session.id)}
                  className={`flex justify-between items-center px-4 py-3 cursor-pointer ${
                    activeChatId === session.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p 
                      className={`text-sm font-medium truncate ${
                        activeChatId === session.id
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(session.updated_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, session.id)}
                    className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sidebar footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.push('/history')}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View History
        </button>
      </div>
    </div>
  )
}

export default Sidebar