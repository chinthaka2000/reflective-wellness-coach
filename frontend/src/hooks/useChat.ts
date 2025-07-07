// 🧠 Mental Wellness AI Assistant - Chat Hook

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '../utils/api';
import { Message, ChatSettings, SentimentAnalysis } from '../types';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/helpers';

interface UseChatOptions {
  autoScroll?: boolean;
  saveHistory?: boolean;
  maxMessages?: number;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  settings: ChatSettings;
  sendMessage: (content: string, additionalData?: Record<string, any>) => Promise<void>;
  clearMessages: () => void;
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
  retryLastMessage: () => Promise<void>;
  exportChatHistory: () => string;
  importChatHistory: (history: string) => boolean;
}

const DEFAULT_SETTINGS: ChatSettings = {
  personality_mode: 'calm_coach',
  language: 'english',
  auto_save_reflections: true,
  show_sentiment_analysis: true,
  enable_mood_tracking: true,
  crisis_detection: true,
};

const STORAGE_KEYS = {
  MESSAGES: 'mental_wellness_chat_messages',
  SETTINGS: 'mental_wellness_chat_settings',
};

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const {
    autoScroll = true,
    saveHistory = true,
    maxMessages = 100,
  } = options;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  // Refs
  const lastMessageRef = useRef<Message | null>(null);
  const chatContainerRef = useRef<HTMLElement | null>(null);

  // Load initial data
  useEffect(() => {
    const savedMessages = loadFromLocalStorage<Message[]>(STORAGE_KEYS.MESSAGES, []);
    const savedSettings = loadFromLocalStorage<ChatSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

    setMessages(savedMessages);
    setSettings(savedSettings);

    // Add welcome message if no messages exist
    if (savedMessages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Welcome to your Mental Wellness AI Assistant! 🧠💙

I'm here to support you on your mental wellness journey. You can:

• **Chat freely** - I'll listen and provide supportive responses
• **Use commands** - Try #mood, #reflect, #todo, #remember, or #sos
• **Track your progress** - I'll help you understand your patterns
• **Get personalized support** - I'll adapt to your needs

How are you feeling today? What would you like to talk about?`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        personality_mode: savedSettings.personality_mode,
      };

      setMessages([welcomeMessage]);
    }
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (saveHistory && messages.length > 0) {
      // Keep only the last maxMessages
      const messagesToSave = messages.slice(-maxMessages);
      saveToLocalStorage(STORAGE_KEYS.MESSAGES, messagesToSave);
    }
  }, [messages, saveHistory, maxMessages]);

  // Save settings when they change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Generate unique message ID
  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle crisis detection
  const handleCrisisDetection = useCallback((sentiment: SentimentAnalysis) => {
    if (settings.crisis_detection && sentiment.urgency_level === 'crisis') {
      // Add crisis support message
      const crisisMessage: Message = {
        id: generateMessageId(),
        content: `🚨 **Crisis Support Resources**

I notice you might be going through a really difficult time. Your safety and wellbeing are important.

**Immediate Help:**
• **Crisis Text Line**: Text HOME to 741741
• **988 Suicide & Crisis Lifeline**: Call 988
• **Emergency Services**: Call 911

**You are not alone. There are people who want to help.**

Would you like to talk about what's happening, or would you prefer me to help you find additional resources?`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        personality_mode: 'calm_coach', // Always use calm coach for crisis
      };

      setMessages(prev => [...prev, crisisMessage]);
    }
  }, [settings.crisis_detection]);

  // Send message function
  const sendMessage = useCallback(async (
    content: string,
    additionalData: Record<string, any> = {}
  ): Promise<void> => {
    if (!content.trim()) return;

    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: Message = {
      id: generateMessageId(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    lastMessageRef.current = userMessage;

    try {
      // Check for special commands
      if (content.startsWith('#')) {
        const command = content.split(' ')[0].toLowerCase();
        
        if (command === '#show') {
          // Handle show memories command
          const memories = await apiService.showMemories();
          const memoryMessage: Message = {
            id: generateMessageId(),
            content: formatMemoriesForDisplay(memories),
            sender: 'assistant',
            timestamp: new Date().toISOString(),
            isMemoryDisplay: true,
          };
          setMessages(prev => [...prev, memoryMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Send to API
      const response = await apiService.sendMessage(
        content,
        settings.personality_mode,
        settings.language,
        additionalData
      );

      // Create assistant message
      const assistantMessage: Message = {
        id: generateMessageId(),
        content: response.response,
        sender: 'assistant',
        timestamp: response.timestamp,
        sentiment: response.sentiment,
        personality_mode: response.personality_mode,
        command_result: response.command_result,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle crisis detection
      if (response.sentiment) {
        handleCrisisDetection(response.sentiment);
      }

      // Auto-save reflections if enabled and it's a reflection command
      if (settings.auto_save_reflections && response.command_result?.type === 'reflection') {
        console.log('✅ Reflection automatically saved');
      }

    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      
      const errorMessage = err.message || 'Failed to send message. Please try again.';
      setError(errorMessage);

      // Add error message to chat
      const errorChatMessage: Message = {
        id: generateMessageId(),
        content: `❌ **Error**: ${errorMessage}\n\nPlease try again or check your connection.`,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        personality_mode: settings.personality_mode,
      };

      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [settings, handleCrisisDetection]);

  // Retry last message
  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (!lastMessageRef.current) return;

    // Remove the last assistant message if it was an error
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg.sender === 'assistant' && lastMsg.content.includes('❌ **Error**')) {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // Resend the last user message
    await sendMessage(lastMessageRef.current.content);
  }, [sendMessage]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    lastMessageRef.current = null;
    
    if (saveHistory) {
      saveToLocalStorage(STORAGE_KEYS.MESSAGES, []);
    }
  }, [saveHistory]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Export chat history
  const exportChatHistory = useCallback((): string => {
    const exportData = {
      messages,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [messages, settings]);

  // Import chat history
  const importChatHistory = useCallback((history: string): boolean => {
    try {
      const importData = JSON.parse(history);
      
      if (importData.messages && Array.isArray(importData.messages)) {
        setMessages(importData.messages);
        
        if (importData.settings) {
          setSettings(prev => ({ ...prev, ...importData.settings }));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error importing chat history:', error);
      return false;
    }
  }, []);

  const formatMemoriesForDisplay = (memories: any): string => {
    let display = "🧠 **Your Memories & Profile**\n\n";
    
    // User Profile
    if (memories.profile && Object.keys(memories.profile).length > 0) {
      display += "**Personal Information:**\n";
      Object.entries(memories.profile).forEach(([key, value]) => {
        if (key !== 'last_updated') {
          display += `• ${key.replace(/_/g, ' ').toUpperCase()}: ${value}\n`;
        }
      });
      display += "\n";
    }
    
    // Recent Reflections
    if (memories.recent_reflections && memories.recent_reflections.length > 0) {
      display += "**Recent Reflections:**\n";
      memories.recent_reflections.slice(0, 3).forEach((reflection: any) => {
        display += `• ${reflection.content.substring(0, 100)}...\n`;
      });
      display += "\n";
    }
    
    // Important Memories
    if (memories.important_memories && memories.important_memories.length > 0) {
      display += "**Important Memories:**\n";
      memories.important_memories.slice(0, 3).forEach((memory: any) => {
        display += `• ${memory.content.substring(0, 100)}...\n`;
      });
      display += "\n";
    }
    
    // Memory Stats
    if (memories.memory_stats) {
      display += "**Memory Statistics:**\n";
      display += `• Short-term messages: ${memories.memory_stats.short_term?.message_count || 0}\n`;
      if (memories.memory_stats.long_term) {
        Object.entries(memories.memory_stats.long_term).forEach(([key, value]) => {
          display += `• ${key.replace(/_/g, ' ')}: ${value}\n`;
        });
      }
    }
    
    return display;
  };

  return {
    messages,
    isLoading,
    error,
    settings,
    sendMessage,
    clearMessages,
    updateSettings,
    retryLastMessage,
    exportChatHistory,
    importChatHistory,
  };
};

// Helper hook for managing typing indicators
export const useTypingIndicator = (delay: number = 1000) => {
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(() => {
    setIsTyping(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, delay);
  }, [delay]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isTyping, startTyping, stopTyping };
};

// Helper hook for managing chat scroll
export const useChatScroll = () => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto' 
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  });

  return { chatEndRef, scrollToBottom };
};
