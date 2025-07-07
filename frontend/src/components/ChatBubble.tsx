import React from 'react'
import { motion } from 'framer-motion'
import { BrainIcon } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  remembered?: string
  personality_mode?: string // add this
}

interface ChatBubbleProps {
  message: Message
  hideTimestamp?: boolean
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, hideTimestamp }) => {
  const isAi = message.sender === 'ai'
  
  const bubbleVariants = {
    initial: {
      opacity: 0,
      x: isAi ? -10 : 10,
      y: 10,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`max-w-[80%] ${isAi ? 'mr-auto' : 'ml-auto'}`}>
        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          className={`p-3 rounded-2xl ${isAi ? 'glass-card dark:border-opacity-20 dark:bg-opacity-95' : 'gradient-primary text-white'}`}
        >
          <p
            className={`text-sm md:text-base ${isAi ? 'card-content enhanced-text ai-response' : 'enhanced-text user-message'} select-text`}
            style={{
              fontFamily: "'Playfair Display', 'Times New Roman', serif",
              fontWeight: isAi ? 400 : 500,
              lineHeight: isAi ? 1.7 : 1.5,
              letterSpacing: isAi ? '0.005em' : '0.02em',
              fontSize: '16px'
            }}
          >
            {message.text}
          </p>
        </motion.div>
        
        {message.remembered && (
          <motion.div
            initial={{
              opacity: 0,
              y: 5,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.5,
              duration: 0.3,
            }}
            className="flex items-center mt-1 text-xs text-primary enhanced-text"
          >
            <BrainIcon className="w-3 h-3 mr-1 text-accent" />
            <span className="text-primary">Remembered: {message.remembered}</span>
          </motion.div>
        )}

        {/* Show chat mode/personality_mode for AI messages */}
        {isAi && message.personality_mode && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex items-center mt-1 text-xs enhanced-text"
          >
            <BrainIcon className="w-3 h-3 mr-1 text-accent" />
            <span className="text-primary">Mode: {message.personality_mode.replace('_', ' ')}</span>
          </motion.div>
        )}
        
        {!hideTimestamp && (
        <div className="text-xs text-text/60 mt-1">
          {new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
          }).format(message.timestamp)}
        </div>
        )}
      </div>
    </motion.div>
  )
}

export default ChatBubble 