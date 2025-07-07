import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'
import { motion } from 'framer-motion'

// Example of integrating ReflectAI UI with your existing component
const ExampleComponent: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme()
  
  // Your existing component logic here
  const yourExistingData = {
    title: 'Your Existing Data',
    // ...other properties
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header with theme toggle */}
      <header className="px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-serif font-medium text-primary">
          Your App Name
        </h1>
        <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </header>

      {/* Your existing content with ReflectAI styling */}
      <main className="p-4">
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
            ease: "easeOut",
          }}
          className="glass-card p-6 max-w-md mx-auto"
        >
          <h2 className="font-serif text-2xl mb-4 text-gradient-reflect">
            {yourExistingData.title}
          </h2>
          
          {/* Your existing UI elements with ReflectAI styling */}
          <p className="text-text opacity-80 mb-4 leading-relaxed">
            This is your existing content with ReflectAI styling applied. 
            The glass morphism effect creates a modern, sophisticated look 
            that's perfect for mental wellness applications.
          </p>
          
          <div className="space-y-3">
            <button className="w-full py-3 rounded-lg gradient-primary text-white font-medium transition-all duration-300 hover:shadow-lg active:scale-95">
              Your Existing Action Button
            </button>
            
            <button className="w-full py-3 rounded-lg btn-reflect-secondary font-medium">
              Secondary Action
            </button>
          </div>
        </motion.div>

        {/* Additional example cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="glass-card p-4"
          >
            <h3 className="font-medium text-primary mb-2">Feature Card</h3>
            <p className="text-text opacity-70 text-sm">
              Example of a feature card with glass morphism styling.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="glass-card p-4"
          >
            <h3 className="font-medium text-secondary mb-2">Another Feature</h3>
            <p className="text-text opacity-70 text-sm">
              Another example card showing the versatility of the design system.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default ExampleComponent 