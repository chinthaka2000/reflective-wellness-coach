// 🧠 Mental Wellness AI Assistant - Helper Utilities

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { Message, Task, MoodEntry, SentimentAnalysis } from '../types';

// Date and time utilities
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown time';
  }
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'some time ago';
  }
};

export const formatDateOnly = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date only:', error);
    return 'Unknown date';
  }
};

// Mood utilities
export const getMoodLabel = (moodValue: number): string => {
  const moodLabels: Record<number, string> = {
    1: 'Terrible',
    2: 'Very Bad',
    3: 'Bad',
    4: 'Poor',
    5: 'Okay',
    6: 'Good',
    7: 'Very Good',
    8: 'Great',
    9: 'Excellent',
    10: 'Amazing'
  };
  
  return moodLabels[moodValue] || 'Unknown';
};

export const getMoodColor = (moodValue: number): string => {
  if (moodValue <= 3) return 'text-red-600 bg-red-100';
  if (moodValue <= 5) return 'text-orange-600 bg-orange-100';
  if (moodValue <= 7) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
};

export const getMoodEmoji = (moodValue: number): string => {
  const moodEmojis: Record<number, string> = {
    1: '😰',
    2: '😟',
    3: '😕',
    4: '🙁',
    5: '😐',
    6: '🙂',
    7: '😊',
    8: '😄',
    9: '😁',
    10: '🤩'
  };
  
  return moodEmojis[moodValue] || '😐';
};

// Task utilities
export const getTaskPriorityColor = (priority: string): string => {
  const colors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    urgent: 'text-red-600 bg-red-100'
  };
  
  return colors[priority as keyof typeof colors] || colors.medium;
};

export const getTaskCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    self_care: '🌸',
    mindfulness: '🧘‍♀️',
    exercise: '💪',
    social: '👥',
    work: '💼',
    personal: '👤',
    health: '❤️',
    learning: '📚',
    creative: '🎨',
    household: '🏠'
  };
  
  return icons[category] || '📝';
};

export const getTaskStatusColor = (status: string): string => {
  const colors = {
    pending: 'text-gray-600 bg-gray-100',
    in_progress: 'text-blue-600 bg-blue-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100'
  };
  
  return colors[status as keyof typeof colors] || colors.pending;
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.due_date || task.status === 'completed') return false;
  
  try {
    const dueDate = parseISO(task.due_date);
    return dueDate < new Date();
  } catch {
    return false;
  }
};

// Sentiment analysis utilities
export const getSentimentColor = (sentiment: string): string => {
  const colors = {
    positive: 'text-green-600 bg-green-100',
    negative: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  };
  
  return colors[sentiment as keyof typeof colors] || colors.neutral;
};

export const getSentimentEmoji = (sentiment: string): string => {
  const emojis = {
    positive: '😊',
    negative: '😔',
    neutral: '😐'
  };
  
  return emojis[sentiment as keyof typeof emojis] || '😐';
};

export const getUrgencyColor = (urgency: string): string => {
  const colors = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    crisis: 'text-red-600 bg-red-100 animate-pulse'
  };
  
  return colors[urgency as keyof typeof colors] || colors.low;
};

// Message utilities
export const extractCommands = (message: string): string[] => {
  const commandPattern = /#(\w+)/g;
  const commands = [];
  let match;
  
  while ((match = commandPattern.exec(message)) !== null) {
    commands.push(match[1]);
  }
  
  return commands;
};

export const formatMessageContent = (content: string): string => {
  // Basic markdown-like formatting
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};

// Personality mode utilities
export const getPersonalityModeEmoji = (mode: string): string => {
  const emojis: Record<string, string> = {
    calm_coach: '🧘‍♀️',
    assertive_buddy: '💪',
    playful_companion: '😊',
    wise_mentor: '🦉',
    practical_helper: '🛠️'
  };
  
  return emojis[mode] || '🤖';
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Storage utilities
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Analytics utilities
export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const generateInsight = (data: any[], type: 'mood' | 'task' | 'sentiment'): string[] => {
  const insights: string[] = [];
  
  if (data.length === 0) {
    return ['Not enough data available for insights.'];
  }
  
  switch (type) {
    case 'mood':
      const avgMood = calculateAverage(data.map(d => d.mood_value || d.value));
      if (avgMood >= 7) {
        insights.push('Your overall mood has been quite positive! 🌟');
      } else if (avgMood <= 4) {
        insights.push('Your mood has been lower recently. Consider self-care activities. 💙');
      } else {
        insights.push('Your mood has been moderate. Small positive changes can help! 🌱');
      }
      break;
      
    case 'task':
      const completionRate = calculatePercentage(
        data.filter(d => d.status === 'completed').length,
        data.length
      );
      
      if (completionRate >= 80) {
        insights.push('Excellent task completion rate! You\'re very productive! 🏆');
      } else if (completionRate >= 50) {
        insights.push('Good progress on tasks. Consider breaking larger ones into smaller steps. 📈');
      } else {
        insights.push('Focus on completing fewer tasks consistently. Quality over quantity! 🎯');
      }
      break;
      
    case 'sentiment':
      const positiveCount = data.filter(d => d.overall_sentiment === 'positive').length;
      const negativeCount = data.filter(d => d.overall_sentiment === 'negative').length;
      
      if (positiveCount > negativeCount) {
        insights.push('Your messages show mostly positive sentiment! Keep it up! 😊');
      } else if (negativeCount > positiveCount) {
        insights.push('You\'ve been expressing some challenging emotions. That\'s completely normal. 💙');
      } else {
        insights.push('Your emotional expression has been balanced. 😌');
      }
      break;
  }
  
  return insights;
};

// Text processing utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const highlightKeywords = (text: string, keywords: string[]): string => {
  let highlightedText = text;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedText = highlightedText.replace(
      regex, 
      '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
    );
  });
  
  return highlightedText;
};

// Accessibility utilities
export const getAriaLabel = (type: string, value: any): string => {
  switch (type) {
    case 'mood':
      return `Mood level ${value} out of 10, ${getMoodLabel(value)}`;
    case 'task':
      return `Task: ${value.title}, Priority: ${value.priority}, Status: ${value.status}`;
    case 'message':
      return `Message from ${value.sender} at ${formatRelativeTime(value.timestamp)}`;
    default:
      return 'Interactive element';
  }
};

// Color utilities
export const generateGradient = (color1: string, color2: string): string => {
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Export all utilities as a single object for easy importing
export const utils = {
  date: {
    formatDate,
    formatRelativeTime,
    formatDateOnly,
  },
  mood: {
    getMoodLabel,
    getMoodColor,
    getMoodEmoji,
  },
  task: {
    getTaskPriorityColor,
    getTaskCategoryIcon,
    getTaskStatusColor,
    isTaskOverdue,
  },
  sentiment: {
    getSentimentColor,
    getSentimentEmoji,
    getUrgencyColor,
  },
  message: {
    extractCommands,
    formatMessageContent,
  },
  validation: {
    validateEmail,
    validatePhoneNumber,
  },
  storage: {
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
  },
  analytics: {
    calculateAverage,
    calculatePercentage,
    generateInsight,
  },
  text: {
    truncateText,
    highlightKeywords,
  },
  accessibility: {
    getAriaLabel,
  },
  performance: {
    debounce,
    throttle,
  },
};
