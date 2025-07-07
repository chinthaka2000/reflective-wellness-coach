import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import BreathingAnimation from './BreathingAnimation'

interface LandingPageProps {
  isDarkMode?: boolean
  toggleTheme?: () => void
  onComplete?: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({
  isDarkMode,
  toggleTheme,
  onComplete,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-serif font-medium text-primary">
          Reflective Wellness Coach
        </h1>
        {toggleTheme && isDarkMode !== undefined && (
          <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        )}
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="w-full max-w-md text-center mb-12"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-semibold mb-4 leading-tight">
            Your companion for mental wellness
          </h2>
          <p className="text-lg opacity-80 mb-8">
            Journal your thoughts, track your mood, and chat with an AI that
            understands.
          </p>
        </motion.div>
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.3,
            duration: 0.6,
          }}
          className="w-full max-w-md mb-12"
        >
          <BreathingAnimation />
        </motion.div>
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.6,
            duration: 0.6,
          }}
          className="w-full max-w-md"
        >
          <button
            onClick={onComplete}
            className="w-full py-4 px-6 rounded-full gradient-primary text-white font-medium flex items-center justify-center"
          >
            <span className="mr-2">Start your journey</span>
            <ArrowRightIcon className="w-5 h-5" />
          </button>
          <div className="mt-8 flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="glass-card p-4 text-center">
              <h3 className="font-serif text-lg mb-2">Journal</h3>
              <p className="text-sm opacity-70">
                Track your thoughts and growth
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <h3 className="font-serif text-lg mb-2">Chat</h3>
              <p className="text-sm opacity-70">Get support when you need it</p>
            </div>
            <div className="glass-card p-4 text-center">
              <h3 className="font-serif text-lg mb-2">Mood</h3>
              <p className="text-sm opacity-70">
                Understand your emotional patterns
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
export default LandingPage

