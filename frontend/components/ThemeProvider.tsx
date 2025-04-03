import React, { createContext, useState, useContext, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextProps {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light')

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null
    
    if (storedTheme) {
      setTheme(storedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  // Update document when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme)
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}