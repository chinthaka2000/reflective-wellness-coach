import React, { useEffect, useState, createContext, useContext } from 'react'

type ThemeContextType = {
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  // Check for user's preference in localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        return savedTheme === 'dark'
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    // Update localStorage and apply class to document
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', isDarkMode)
    }
  }, [isDarkMode])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        // Only update if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
          setIsDarkMode(e.matches)
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
} 