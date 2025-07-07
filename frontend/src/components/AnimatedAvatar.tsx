import React from 'react'
import { motion } from 'framer-motion'

const AnimatedAvatar: React.FC = () => {
  return (
    <motion.div
      initial={{
        scale: 0.9,
        opacity: 0,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        duration: 0.5,
      }}
      className="relative"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut',
        }}
        className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center"
      >
        <div className="w-14 h-14 rounded-full bg-background/80 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <motion.path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{
                pathLength: 0,
              }}
              animate={{
                pathLength: 1,
              }}
              transition={{
                duration: 2,
                ease: 'easeInOut',
              }}
            />
            <motion.path
              d="M8 14C8.5 15.5 10 16.5 12 16.5C14 16.5 15.5 15.5 16 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{
                pathLength: 0,
              }}
              animate={{
                pathLength: 1,
              }}
              transition={{
                duration: 1.5,
                delay: 0.5,
                ease: 'easeInOut',
              }}
            />
            <motion.path
              d="M9 9.5H9.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.5,
                delay: 1.5,
              }}
            />
            <motion.path
              d="M15 9.5H15.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.5,
                delay: 1.5,
              }}
            />
          </svg>
        </div>
      </motion.div>
      <motion.div
        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-background text-xs py-1 px-3 rounded-full shadow-sm"
        initial={{
          y: 10,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          delay: 0.5,
        }}
      >
        <span className="text-primary font-medium enhanced-text">AlwaysBeHappy</span>
      </motion.div>
    </motion.div>
  )
}

export default AnimatedAvatar 