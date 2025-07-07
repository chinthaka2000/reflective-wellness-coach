import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Trash2, Heart, Brain, AlertTriangle, CheckCircle, Smile, Mic, Info, X, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import ChatBubble from './ChatBubble';
import AnimatedAvatar from './AnimatedAvatar';

// Types and utilities
import { Message, ChatSettings, SentimentAnalysis, PersonalityModes } from '../types';
import { formatRelativeTime, getSentimentColor, getSentimentEmoji, getUrgencyColor } from '../utils/helpers';
import { apiService } from '../utils/api';

interface ChatBubbleMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  remembered?: string;
  personality_mode?: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  settings: ChatSettings;
  onSendMessage: (content: string, additionalData?: Record<string, any>) => Promise<void>;
  onRetry: () => Promise<void>;
  onClearMessages: () => void;
  onUpdateSettings: (settings: Partial<ChatSettings>) => void; // <-- add this prop
}

interface SentimentDisplayProps {
  sentiment: SentimentAnalysis;
}

const SentimentDisplay: React.FC<SentimentDisplayProps> = ({ sentiment }) => {
  return (
    <div className="space-y-2">
      {/* Overall sentiment */}
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-text/70">Sentiment:</span>
        <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(sentiment.overall_sentiment)}`}>
          {getSentimentEmoji(sentiment.overall_sentiment)} {sentiment.overall_sentiment}
        </span>
      </div>

      {/* Urgency level */}
      {sentiment.urgency_level !== 'low' && (
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-text/70">Urgency:</span>
          <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(sentiment.urgency_level)}`}>
            {sentiment.urgency_level}
          </span>
        </div>
      )}

      {/* Dominant emotions */}
      {Object.keys(sentiment.emotions).length > 0 && (
        <div className="flex items-start space-x-2">
          <span className="text-xs font-medium text-text/70">Emotions:</span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(sentiment.emotions)
              .filter(([_, score]) => score > 0.3)
              .slice(0, 3)
              .map(([emotion, score]) => (
                <span
                  key={emotion}
                  className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full"
                >
                  {emotion} ({Math.round(score * 100)}%)
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Mental health indicators */}
      {(sentiment.mental_health_indicators.crisis_indicators.length > 0 ||
        sentiment.mental_health_indicators.positive_coping.length > 0) && (
        <div className="text-xs">
          {sentiment.mental_health_indicators.crisis_indicators.length > 0 && (
            <div className="text-red-400 font-medium">⚠️ Crisis indicators detected</div>
          )}
          {sentiment.mental_health_indicators.positive_coping.length > 0 && (
            <div className="text-green-400">✅ Positive coping mentioned</div>
          )}
        </div>
      )}
    </div>
  );
};

const emotionTipMap: Record<string, string> = {
  fear: 'try some deep breathing exercises',
  anger: 'consider a quick physical activity, like a walk',
  stress: 'use a grounding technique, such as the 5-4-3-2-1 method',
  joy: 'reflect on what you are grateful for',
  sadness: 'reach out to a friend or write down your feelings',
  surprise: 'pause and notice your body sensations',
  disgust: 'step away and do something you enjoy',
};

function getPrimaryEmotion(emotions: Record<string, number>): string | null {
  const entries = Object.entries(emotions);
  if (!entries.length) return null;
  // Find the emotion with the highest score
  const [primary] = entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));
  return primary;
}

function getEmotionTip(emotion: string): string {
  return emotionTipMap[emotion] || 'take a mindful pause and check in with yourself';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  error,
  settings,
  onSendMessage,
  onRetry,
  onClearMessages,
  onUpdateSettings, // <-- add this prop
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [showCommandHelp, setShowCommandHelp] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [personalityModes, setPersonalityModes] = useState<PersonalityModes>({});
  const [isLoadingModes, setIsLoadingModes] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Show calming tip after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTip(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showModeSelector && Object.keys(personalityModes).length === 0) {
      setIsLoadingModes(true);
      apiService.getPersonalityModes().then(res => {
        setPersonalityModes(res.modes);
      }).finally(() => setIsLoadingModes(false));
    }
  }, [showModeSelector]);

  const handlePersonalityChange = async (mode: string) => {
    setIsLoadingModes(true);
    try {
      await apiService.setPersonalityMode(mode);
      onUpdateSettings?.({ personality_mode: mode });
      setShowModeSelector(false);
      toast.success(`Switched to ${personalityModes[mode]?.name} mode`);
    } catch (error) {
      toast.error('Failed to change personality mode');
    } finally {
      setIsLoadingModes(false);
    }
  };

  // Handle message send
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageToSend = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(messageToSend);
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick command buttons
  const quickCommands = [
    { command: '#mood', label: 'Log Mood', description: 'Track your current emotional state' },
    { command: '#reflect', label: 'Reflect', description: 'Save a personal reflection' },
    { command: '#todo', label: 'Add Task', description: 'Create a wellness-focused task' },
    { command: '#remember', label: 'Remember', description: 'Save important information' },
  ];

  const insertCommand = (command: string) => {
    setInputValue(prev => {
      const newValue = prev ? `${prev} ${command} ` : `${command} `;
      return newValue;
    });
    inputRef.current?.focus();
  };

  // Convert messages to ChatBubble format
  const convertMessageToChatBubble = (message: Message): ChatBubbleMessage => {
    // Temporary test: Show remembered indicator for first AI message
    const isFirstAiMessage = message.sender === 'assistant' && 
      messages.findIndex(m => m.id === message.id) === messages.findIndex(m => m.sender === 'assistant');
    
    return {
    id: message.id,
    text: message.content,
      sender: message.sender === 'user' ? 'user' : 'ai',
    timestamp: new Date(message.timestamp),
      remembered: message.isMemoryDisplay || isFirstAiMessage ? "This information has been saved to your memory" : undefined,
      personality_mode: message.personality_mode, // Pass mode
    };
  };

  // Get sentiment display for the insights panel
  const getSentimentDisplay = (messages: Message[], isLoading?: boolean) => {
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMessage && lastMessage.sentiment && typeof lastMessage.sentiment !== 'string') {
      const sentiment = lastMessage.sentiment as SentimentAnalysis;
      return <SentimentDisplay sentiment={sentiment} />;
    }
    if (isLoading) {
      return (
        <div className="flex items-center mt-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
            <div className="typing-dots flex space-x-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
          <p className="text-sm enhanced-text font-['Playfair_Display']">Analyzing sentiment...</p>
        </div>
      );
    }
    return null;
  };

  // New component for each AI bubble chunk
  const AiBubbleChunk: React.FC<{
    message: ChatBubbleMessage;
    section: string;
    hasShowMore: boolean;
    buttons: string[];
    idx: number;
  }> = ({ message, section, hasShowMore, buttons, idx }) => {
    const [showMore, setShowMore] = useState(false);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + idx * 0.12, duration: 0.4 }}
        className="mb-2"
      >
        <ChatBubble
          message={{
            ...message,
            text: hasShowMore && !showMore ? section.replace(/\[Show More\].*/, '...') : section,
          }}
        />
        <div className="flex gap-2 mt-2">
          {buttons.map((btn) => (
            <button key={btn} className="btn-reflect-secondary text-xs px-3 py-1 rounded-full">
              {btn}
            </button>
          ))}
          {hasShowMore && !showMore && (
            <button
              className="btn-reflect-secondary text-xs px-3 py-1 rounded-full"
              onClick={() => setShowMore(true)}
            >
              Show More
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderAiMessage = (message: ChatBubbleMessage) => {
    const sections = message.text.split(/\n\n|(?=\[Show More\])/g);
    return (
      <>
        {sections.map((section: string, idx: number) => {
          const hasShowMore = section.includes('[Show More]');
          const buttons: string[] = [];
          if (section.includes('[Try Now]')) buttons.push('Try Now');
          if (section.includes('[Another Tip]')) buttons.push('Another Tip');
          return (
            <AiBubbleChunk
              key={idx}
              message={message}
              section={section}
              hasShowMore={hasShowMore}
              buttons={buttons}
              idx={idx}
            />
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen pb-20 md:pb-0 md:flex-row md:gap-6 chat-container">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col h-full">
        {/* Fixed Avatar at Top */}
        <div className="flex justify-center py-4 bg-background/50 backdrop-blur-sm border-b border-white/10 fixed-avatar">
            <AnimatedAvatar />
          </div>
          
        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2 md:px-0 md:py-0 chat-messages">
          <div className="max-w-md mx-auto">
          <AnimatePresence>
            {showInfo && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                className="glass-card p-4 mb-4 card-content"
              >
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-primary mr-2 mt-1 flex-shrink-0" />
                  <div>
                      <h3 className="font-serif font-medium mb-1 enhanced-text">Welcome to Mental Wellness AI</h3>
                    <p className="text-sm opacity-80 mb-2 enhanced-text">
                        I'm here to support your mental wellness journey. Share your thoughts, feelings, and experiences with me.
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{
                    scale: 1.02,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() => setShowInfo(false)}
                  className="w-full mt-3 py-2 text-sm text-primary"
                >
                  Got it
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Command help panel */}
          <AnimatePresence>
            {showCommandHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card border-b border-white/20 overflow-hidden mb-4"
              >
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-serif font-medium text-primary mb-2 enhanced-text">Quick Commands</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickCommands.map((cmd, index) => (
                        <motion.button
                          key={cmd.command}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => insertCommand(cmd.command)}
                          className="flex items-center space-x-2 p-3 glass-card hover:bg-white/10 transition-all duration-200 text-left"
                        >
                          <code className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {cmd.command}
                          </code>
                          <div>
                            <div className="text-sm font-medium text-text enhanced-text">{cmd.label}</div>
                            <div className="text-xs text-text/60 enhanced-text">{cmd.description}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-primary/80 enhanced-text">
                    <p><strong>Crisis Support:</strong> Type #sos for immediate mental health resources</p>
                    <p><strong>Languages:</strong> Switch between English, Sinhala, and Tamil in settings</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-text/60">
                  Start a conversation to begin your wellness journey...
                </p>
              </motion.div>
            ) : (
              messages.map((message) => (
                <div key={message.id}>
                    {message.sender === 'user' ? (
                  <ChatBubble 
                    message={convertMessageToChatBubble(message)} 
                  />
                    ) : (
                      renderAiMessage(convertMessageToChatBubble(message))
                    )}
                    
                    {/* Mobile Sentiment Display - Show for user messages with sentiment */}
                    {message.sender === 'user' && message.sentiment && typeof message.sentiment !== 'string' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                        className="md:hidden mt-2 ml-4"
                    >
                        <div className="glass-card p-3 bg-background/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <Heart className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-primary">Emotion Analysis</span>
                          </div>
                          <SentimentDisplay sentiment={message.sentiment as SentimentAnalysis} />
                      </div>
                    </motion.div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="flex items-center"
              >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <div className="typing-dots flex space-x-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                  <p className="text-sm enhanced-text font-['Playfair_Display']">consultant is thinking...</p>
              </motion.div>
            )}
            
              <div style={{ height: '90px' }} aria-hidden="true" />
            <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Reflection Insights Panel */}
      <motion.div
        className="hidden md:block md:w-80 lg:w-96 h-full"
        initial={{
          opacity: 0,
          x: 20,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          delay: 0.5,
        }}
      >
        <div className="glass-card p-6 md:p-8 h-full rounded-3xl shadow-reflect border-2 border-primary/30 bg-white/60 dark:bg-[#23233a]/70 backdrop-blur-lg relative overflow-hidden">
          {/* Gradient border accent */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(139,159,232,0.12), rgba(213,179,255,0.10), rgba(255,182,193,0.10))',
            zIndex: 0,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)'
          }} />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center bg-accent/20 dark:bg-accent/30 rounded-full p-2 shadow-md">
                  <Brain className="w-7 h-7 text-accent animate-bounce-gentle" />
                </span>
                <h2 className="font-serif text-2xl font-bold text-primary dark:text-white enhanced-text" style={{ fontFamily: "'Playfair Display', serif" }}>
              Reflection Insights
            </h2>
              </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCommandHelp(!showCommandHelp)}
                className="p-2 text-text/60 hover:text-primary btn-reflect-ghost"
              title="Show commands help"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
          </div>
            <div className="space-y-3 md:space-y-4 flex-1">
              {/* Recent Patterns */}
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-5 h-5 text-primary dark:text-secondary" />
                  <h3 className="text-base font-serif font-semibold text-primary dark:text-secondary enhanced-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                Recent Patterns
              </h3>
                </div>
                <div className="">
                  <ChatBubble message={{
                    id: 'insight-pattern',
                    text: "You've mentioned feeling anxious about work deadlines three times this week.",
                    sender: 'ai',
                    timestamp: new Date(),
                  }} hideTimestamp />
                </div>
              </div>
              <div className="h-0.5 w-full bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 my-1 md:my-2 rounded-full" />
              {/* Sentiment/Emotion Display */}
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-5 h-5 text-primary dark:text-accent" />
                  <h3 className="text-base font-serif font-semibold text-primary dark:text-accent enhanced-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Sentiment & Emotions
                  </h3>
                </div>
                <div className="">
                  {messages.length > 0 ? (
                    <ChatBubble message={{
                      id: 'insight-sentiment',
                      text: 'Your emotional analysis below.',
                      sender: 'ai',
                      timestamp: new Date(),
                    }} hideTimestamp />
                  ) : (
                    <ChatBubble message={{
                      id: 'insight-sentiment-empty',
                      text: 'Start a conversation to see sentiment analysis.',
                      sender: 'ai',
                      timestamp: new Date(),
                    }} hideTimestamp />
                  )}
                  <div className="mt-2">
                    {getSentimentDisplay(messages, isLoading)}
                    {/* Dynamic emotion tip */}
                    {(() => {
                      const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user' && m.sentiment && typeof m.sentiment !== 'string');
                      if (lastUserMsg && lastUserMsg.sentiment && typeof lastUserMsg.sentiment !== 'string') {
                        const sentiment = lastUserMsg.sentiment as SentimentAnalysis;
                        const primaryEmotion = getPrimaryEmotion(sentiment.emotions);
                        if (primaryEmotion) {
                          const tip = getEmotionTip(primaryEmotion);
                          return (
                            <div className="mt-3 p-3 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-accent text-sm font-serif">
                              <span role="img" aria-label={primaryEmotion} className="mr-1">💡</span>
                              It sounds like you're feeling <span className="font-semibold">{primaryEmotion}</span>. One thing that may help is <span className="font-semibold">{tip}</span>.
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
            </div>
              </div>
              </div>
              <div className="h-0.5 w-full bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20 my-1 md:my-2 rounded-full" />
              {/* Mood Trends */}
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Smile className="w-5 h-5 text-primary dark:text-secondary" />
                  <h3 className="text-base font-serif font-semibold text-primary dark:text-secondary enhanced-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Mood Trends
                  </h3>
            </div>
                <div className="">
                  <ChatBubble message={{
                    id: 'insight-mood',
                    text: 'Your mood has been improving',
                    sender: 'ai',
                    timestamp: new Date(),
                  }} hideTimestamp />
                  <div className="flex justify-center mt-2">
                    <span className="text-lg mr-1">😔</span>
                    <span className="text-lg mr-1">😐</span>
                    <span className="text-lg mr-1">🙂</span>
                    <span className="text-lg pulse-animation">😊</span>
                  </div>
                </div>
              </div>
              <div className="h-0.5 w-full bg-gradient-to-r from-accent/20 via-primary/20 to-secondary/20 my-1 md:my-2 rounded-full" />
              {/* Daily Wellness Tip */}
              <AnimatePresence>
                {showTip && (
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="w-5 h-5 text-primary dark:text-accent" />
                      <h3 className="text-base font-serif font-semibold text-primary dark:text-accent enhanced-text" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Daily Wellness Tip
                      </h3>
                    </div>
                    <div className="flex items-start">
                      <Heart className="w-5 h-5 text-primary dark:text-accent mr-3 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <ChatBubble message={{
                          id: 'insight-tip',
                          text: 'Try the 4-7-8 breathing technique to reduce anxiety',
                          sender: 'ai',
                          timestamp: new Date(),
                        }} hideTimestamp />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowTip(false)}
                          className="text-xs text-primary dark:text-accent enhanced-text hover:text-primary/80 dark:hover:text-accent/80 transition-colors mt-2"
                        >
                          Dismiss
                        </motion.button>
                        
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="border-t border-white/2">
                  <div className="text-xs text-text/60 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                <p>Your mental wellness journey</p>
                    <p>© 2025 Chinthaka2000</p>
              </div></div>
        </div>
        
      </motion.div>
     
      

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-4 left-4 right-4 z-50 glass-card border-red-400/20 bg-red-400/10"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="flex items-center space-x-1 px-3 py-1 bg-red-400/20 text-red-400 rounded-lg hover:bg-red-400/30 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Retry</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area - Desktop */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 px-4 py-4 z-10 chat-input-container">
        <motion.div
          initial={{
            y: 20,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            delay: 0.2,
          }}
          className="w-full max-w-[650px] mx-auto md:-ml-1 px-4"
          style={{ marginLeft: '180px' }}
        >
          <div className="glass-card p-3 flex items-center shadow-lg">
            <motion.button
              className="p-2 text-text/70 rounded-full hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowModeSelector(true)}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share how you're feeling..."
              className="flex-1 bg-transparent border-none outline-none resize-none mx-2 text-text placeholder:text-text/50 max-h-32 enhanced-text chat-input"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                fontSize: '16px'
              }}
              rows={1}
              disabled={isLoading}
            />
            <motion.button
              className="p-2 text-text/70 rounded-full mr-1 hover:text-primary transition-colors"
              whileHover={{
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.9,
              }}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.9,
              }}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`p-2 rounded-full transition-all duration-200 ${inputValue.trim() && !isLoading ? 'bg-primary text-white shadow-lg' : 'bg-primary/30 text-white/50'}`}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Input area - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 py-4 z-10 chat-input-container">
        <motion.div
          initial={{
            y: 20,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            delay: 0.2,
          }}
          className="w-full px-4"
        >
          <div className="glass-card p-3 flex items-center shadow-lg">
            <motion.button
              className="p-2 text-text/70 rounded-full hover:text-primary transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowModeSelector(true)}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share how you're feeling..."
              className="flex-1 bg-transparent border-none outline-none resize-none mx-2 text-text placeholder:text-text/50 max-h-32 enhanced-text chat-input"
              style={{
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                fontWeight: 400,
                lineHeight: 1.6,
                letterSpacing: '0.01em',
                fontSize: '16px'
              }}
              rows={1}
              disabled={isLoading}
            />
            <motion.button
              className="p-2 text-text/70 rounded-full mr-1 hover:text-primary transition-colors"
              whileHover={{
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.9,
              }}
            >
              <Mic className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{
                scale: 1.1,
              }}
              whileTap={{
                scale: 0.9,
              }}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`p-2 rounded-full transition-all duration-200 ${inputValue.trim() && !isLoading ? 'bg-primary text-white shadow-lg' : 'bg-primary/30 text-white/50'}`}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Mode Selector Modal/Popover */}
      <AnimatePresence>
        {showModeSelector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModeSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-8 rounded-2xl max-w-md w-full relative shadow-reflect border-2 border-primary"
              style={{ fontFamily: "'Playfair Display', serif" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <Brain className="w-10 h-10 text-accent animate-bounce-gentle" />
                <h3 className="text-2xl font-bold text-primary text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Choose AI Personality Mode</h3>
              </div>
              {isLoadingModes ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
                  <p className="text-text/60">Loading modes...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(personalityModes).map(([modeId, mode]) => (
                    <motion.button
                      key={modeId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePersonalityChange(modeId)}
                      className={`w-full flex items-center space-x-4 p-4 rounded-2xl border-2 transition-all duration-200 mb-2 shadow-md
                        ${settings.personality_mode === modeId
                          ? 'gradient-primary border-primary text-white shadow-lg scale-105'
                          : 'glass-card border-white/30 hover:border-primary/40 hover:shadow-lg bg-background/80 text-primary'}
                      `}
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      <span className="text-3xl mr-2">{mode.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-lg mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{mode.name}</div>
                        <div className="text-sm text-text/80 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{mode.description}</div>
                        {settings.personality_mode === modeId && (
                          <div className="mt-1 text-xs text-accent font-semibold tracking-wide">✓ Active</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModeSelector(false)}
                className="absolute top-3 right-3 p-2 rounded-full btn-reflect-ghost"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;
