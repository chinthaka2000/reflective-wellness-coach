import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BreathingAnimation: React.FC = () => {
  const [breathingState, setBreathingState] = useState<
    'inhale' | 'hold' | 'exhale'
  >('inhale')
  const [count, setCount] = useState(4)
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prevCount) => {
        if (prevCount === 1) {
          setBreathingState((prevState) => {
            if (prevState === 'inhale') return 'hold'
            if (prevState === 'hold') return 'exhale'
            return 'inhale'
          })
          return breathingState === 'inhale'
            ? 7
            : breathingState === 'hold'
              ? 8
              : 4
        }
        return prevCount - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [breathingState])
  const circleVariants = {
    inhale: {
      scale: 1.2,
      opacity: 1,
      transition: {
        duration: 4,
        ease: 'easeInOut',
      },
    },
    hold: {
      scale: 1.2,
      opacity: 1,
      transition: {
        duration: 7,
        ease: 'linear',
      },
    },
    exhale: {
      scale: 0.8,
      opacity: 0.7,
      transition: {
        duration: 8,
        ease: 'easeInOut',
      },
    },
  }
  const textVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.3,
      },
    },
  }
  return (
    <div className="relative flex flex-col items-center justify-center h-60">
      <motion.div
        className="absolute w-48 h-48 rounded-full gradient-accent"
        variants={circleVariants}
        animate={breathingState}
      />
      <motion.div
        className="absolute w-44 h-44 rounded-full bg-background opacity-50"
        variants={circleVariants}
        animate={breathingState}
      />
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={breathingState}
            className="text-center"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={textVariants}
          >
            <p className="font-serif text-xl mb-2">
              {breathingState === 'inhale'
                ? 'Breathe In'
                : breathingState === 'hold'
                  ? 'Hold'
                  : 'Breathe Out'}
            </p>
            <p className="text-3xl font-light">{count}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
export default BreathingAnimation 