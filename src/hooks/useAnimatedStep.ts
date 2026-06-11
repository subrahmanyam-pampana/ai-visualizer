import { useState, useRef, useCallback } from 'react'

interface AnimatedStep {
  currentStep: number
  totalSteps: number
  isRunning: boolean
  nextStep: () => void
  resetStep: () => void
  startAutoPlay: (intervalMs?: number) => void
  stopAutoPlay: () => void
}

export function useAnimatedStep(total: number): AnimatedStep {
  const [currentStep, setCurrentStep] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((s) => {
      if (s >= total - 1) {
        stopAutoPlay()
        return s
      }
      return s + 1
    })
  }, [total, stopAutoPlay])

  const resetStep = useCallback(() => {
    stopAutoPlay()
    setCurrentStep(-1)
  }, [stopAutoPlay])

  const startAutoPlay = useCallback(
    (intervalMs = 1800) => {
      if (isRunning) {
        stopAutoPlay()
        return
      }
      setIsRunning(true)
      intervalRef.current = setInterval(() => {
        setCurrentStep((s) => {
          if (s >= total - 1) {
            stopAutoPlay()
            return s
          }
          return s + 1
        })
      }, intervalMs)
    },
    [isRunning, total, stopAutoPlay],
  )

  return { currentStep, totalSteps: total, isRunning, nextStep, resetStep, startAutoPlay, stopAutoPlay }
}
