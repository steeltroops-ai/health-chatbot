import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

const Home: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to chat if already logged in
    if (status === 'authenticated') {
      router.push('/chat')
    }
  }, [status, router])

  return (
    <div>
      <Head>
        <title>Medical Chatbot</title>
        <meta name="description" content="AI-powered medical chatbot for health guidance" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Medical Guidance</span>
            <span className="block text-primary-600 dark:text-primary-400">Powered by AI</span>
          </h1>
          <p className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg md:mt-5 md:text-xl">
            Get health information, symptom analysis, and specialist recommendations. 
            Always consult with healthcare professionals for medical advice.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/chat"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:text-lg md:px-10"
              >
                {status === 'authenticated' ? 'Go to Chat' : 'Get Started'}
              </motion.a>
            </div>
            {status !== 'authenticated' && (
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="/login"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-primary-400 dark:hover:bg-gray-700 md:text-lg md:px-10"
                >
                  Login
                </motion.a>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10"
        >
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Symptom Analysis</h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Describe your symptoms and get information about possible conditions.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Health Guidance</h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Get information about general health topics and preventive care.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Specialist Referral</h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Get suggestions for which type of medical specialist might be appropriate.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default Home