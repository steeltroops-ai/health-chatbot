import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import ChatInterface from '../components/ChatInterface'
import Sidebar from '../components/Sidebar'
import EmptyState from '../components/EmptyState'
import useChatStore from '../utils/chatStore'

const Chat: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activeChatId, fetchSessions, sessions } = useChatStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    
    // Fetch sessions when authenticated
    if (status === 'authenticated' && session) {
      fetchSessions()
    }
  }, [status, session, router, fetchSessions])

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>Chat | Medical Chatbot</title>
      </Head>

      <div className="h-screen flex overflow-hidden bg-white dark:bg-gray-900">
        {/* Mobile sidebar */}
        <div className="md:hidden">
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-gray-600 bg-opacity-75"
                  onClick={() => setIsMobileMenuOpen(false)}
                ></motion.div>
                
                <motion.div
                  initial={{ translateX: -300 }}
                  animate={{ translateX: 0 }}
                  exit={{ translateX: -300 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
                >
                  <Sidebar onCloseSidebar={() => setIsMobileMenuOpen(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="w-64 flex flex-col">
            <Sidebar />
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          <main className="flex-1 overflow-y-auto focus:outline-none">
            <div className="h-full">
              {activeChatId ? (
                <ChatInterface />
              ) : (
                <EmptyState />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Chat