import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import axios from 'axios'
import { format } from 'date-fns'

interface HistoryItem {
  id: string
  query: string
  response: string
  created_at: string
}

interface PaginationData {
  total: number
  pages: number
  current_page: number
}

const History: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    current_page: 1
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const fetchHistory = async (page = 1) => {
    setLoading(true)
    setError('')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const response = await axios.get(`${apiUrl}/history`, {
        params: { page, per_page: 10 },
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      })
      
      setHistory(response.data.history)
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        current_page: response.data.current_page
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load history')
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteHistoryItem = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      await axios.delete(`${apiUrl}/history/${id}`, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      })
      
      // Refresh history
      fetchHistory(pagination.current_page)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item')
      console.error('Error deleting history item:', err)
    }
  }

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      await axios.delete(`${apiUrl}/history/clear`, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`
        }
      })
      
      // Refresh history
      fetchHistory(1)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear history')
      console.error('Error clearing history:', err)
    }
  }

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    
    // Fetch history when authenticated
    if (status === 'authenticated' && session) {
      fetchHistory()
    }
  }, [status, session, router])

  const handlePagination = (newPage: number) => {
    fetchHistory(newPage)
  }

  const toggleExpandItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

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
        <title>Chat History | Medical Chatbot</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat History</h1>
          <button
            onClick={clearAllHistory}
            className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition duration-150"
          >
            Clear All History
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <p className="text-gray-500 dark:text-gray-400">No chat history found.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((item) => (
                <motion.li 
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                        {item.query}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(item.created_at), 'PPpp')}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex">
                      <button
                        onClick={() => toggleExpandItem(item.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {expandedItem === item.id ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {expandedItem === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-2">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{item.query}</p>
                      </div>
                      <div className="bg-primary-50 dark:bg-gray-800 p-3 rounded-md border-l-4 border-primary-500">
                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{item.response}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.li>
              ))}
            </ul>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                    <span className="font-medium">{pagination.pages}</span>
                  </p>
                </div>
                <div className="flex-1 flex justify-end">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePagination(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePagination(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${pagination.current_page === page 
                          ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-600 dark:text-primary-400' 
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePagination(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default History