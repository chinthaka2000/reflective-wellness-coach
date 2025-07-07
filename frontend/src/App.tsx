import React, { useState, useEffect } from 'react';
import { Brain, Menu, X, Settings, Heart, MessageCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import ChatInterface from './components/ChatInterface';
import MoodTracker from './components/MoodTracker';
import TaskManager from './components/TaskManager';
import Analytics from './components/Analytics';
import SettingsPanel from './components/SettingsPanel';
import LandingPage from './components/LandingPage';
import ThemeToggle from './components/ThemeToggle';

// Context and Hooks
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useChat } from './hooks/useChat';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/helpers';

// Types


interface AppState {
  activeTab: 'chat' | 'mood' | 'tasks' | 'analytics' | 'settings';
  sidebarOpen: boolean;
  showWelcome: boolean;
}

function AppContent() {
  // App state
  const [appState, setAppState] = useState<AppState>({
    activeTab: 'chat',
    sidebarOpen: false,
    showWelcome: false,
  });

  const { isDarkMode, toggleTheme } = useTheme();

  // Chat hook
  const {
    messages,
    isLoading,
    error,
    settings,
    sendMessage,
    clearMessages,
    updateSettings,
    retryLastMessage,
  } = useChat({
    autoScroll: true,
    saveHistory: true,
    maxMessages: 100,
  });

  // Check if first visit
  useEffect(() => {
    const hasVisited = loadFromLocalStorage('mental_wellness_has_visited', false);
    if (!hasVisited) {
      setAppState(prev => ({ ...prev, showWelcome: true }));
    }
  }, []);

  // Handle welcome completion
  const handleWelcomeComplete = () => {
    setAppState(prev => ({ ...prev, showWelcome: false }));
    saveToLocalStorage('mental_wellness_has_visited', true);
  };

  // Tab navigation
  const setActiveTab = (tab: AppState['activeTab']) => {
    setAppState(prev => ({ ...prev, activeTab: tab, sidebarOpen: false }));
  };

  // Sidebar toggle
  const toggleSidebar = () => {
    setAppState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  // Navigation items
  const navigationItems = [
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: MessageCircle,
      description: 'Talk with your AI wellness companion',
    },
    {
      id: 'mood' as const,
      label: 'Mood',
      icon: Heart,
      description: 'Track and understand your emotions',
    },
    {
      id: 'tasks' as const,
      label: 'Tasks',
      icon: CheckCircle,
      description: 'Manage wellness-focused goals',
    },
    {
      id: 'analytics' as const,
      label: 'Insights',
      icon: BarChart3,
      description: 'View your progress and patterns',
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      description: 'Customize your experience',
    },
  ];

  // Render active tab content
  const renderActiveTab = () => {
    switch (appState.activeTab) {
      case 'chat':
        return (
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            error={error}
            settings={settings}
            onSendMessage={sendMessage}
            onRetry={retryLastMessage}
            onClearMessages={clearMessages}
            onUpdateSettings={updateSettings} // <-- pass this prop
          />
        );
      case 'mood':
        return <MoodTracker />;
      case 'tasks':
        return <TaskManager />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return (
          <SettingsPanel
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        );
      default:
        return null;
    }
  };

  // Show landing page on first visit
  if (appState.showWelcome) {
    return (
      <div className="min-h-screen bg-background">
        <LandingPage onComplete={handleWelcomeComplete} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'glass-card shadow-reflect',
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar - Fixed/Sticky */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card border-b border-white/20 shadow-reflect sticky top-0 z-50"
      >
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            >
              <Menu className="w-5 h-5 text-text" />
            </button>
            
            <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 mb-1">
            <Brain className="w-9 h-10 text-accent" />
              </div>
              <div className="block">
                <h1 className="text-base sm:text-lg font-bold font-serif enhanced-text text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                Reflective Wellness Coach
                </h1>
                <p className="text-xs text-text/70 font-serif hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Your compassionate companion
                </p>
              </div>
            </div>
          </div>

          {/* Center - Navigation Tabs (Desktop) */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = appState.activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'gradient-primary text-white shadow-lg' 
                      : 'text-text/70 hover:text-text hover:bg-white/10'
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  `}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Right side - Theme Toggle */}
          <div className="flex items-center space-x-2">
            <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Sidebar (Mobile/Tablet) */}
        <AnimatePresence>
          {appState.sidebarOpen && (
        <motion.div 
          initial={{ x: -300 }}
          animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 glass-card lg:hidden"
              transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-9 h-10 text-accent" />
                </div>
                <div>
                      <h1 className="text-lg font-bold text-text enhanced-text" style={{ fontFamily: "'Playfair Display', serif" }}>Mental Wellness</h1>
                      <p className="text-sm text-text/70" style={{ fontFamily: "'Playfair Display', serif" }}>AI Assistant</p>
                </div>
              </div>
              
              {/* Close button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <X className="w-5 h-5 text-text" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = appState.activeTab === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300
                      ${isActive 
                        ? 'gradient-primary text-white shadow-lg' 
                        : 'text-text hover:text-primary hover:bg-white/10'
                      }
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    `}
                        style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text/60'}`} />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/20">
                  <div className="text-xs text-text/60 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                <p>Your mental wellness journey</p>
                    <p>© 2025 Chinthaka2000</p>
              </div>
            </div>
          </div>
        </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Page content */}
          <main className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={appState.activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderActiveTab()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {appState.sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'glass-card shadow-reflect',
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
