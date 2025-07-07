import React from 'react'
import { motion } from 'framer-motion'
import { SunIcon, MoonIcon } from 'lucide-react'

interface ThemeToggleProps {
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  toggleTheme,
}) => {
  return (
    <motion.button
      whileTap={{
        scale: 0.95,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      }}
      onClick={toggleTheme}
      className="p-3 rounded-full glass-card flex items-center justify-center transition-all duration-300"
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDarkMode ? 180 : 0,
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
        }}
      >
        {isDarkMode ? (
          <MoonIcon className="w-5 h-5 text-secondary" />
        ) : (
          <SunIcon className="w-5 h-5 text-primary" />
        )}
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle 