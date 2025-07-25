"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface GameContextType {
  points: number
  level: number
  badges: string[]
  notifications: number
  addPoints: (points: number) => void
  addBadge: (badge: string) => void
}

const GameContext = createContext<GameContextType>({
  points: 0,
  level: 1,
  badges: [],
  notifications: 0,
  addPoints: () => {},
  addBadge: () => {},
})

export function useGame() {
  return useContext(GameContext)
}

interface GameProviderProps {
  children: ReactNode
}

export function GameProvider({ children }: GameProviderProps) {
  const [points, setPoints] = useState(1250)
  const [level, setLevel] = useState(3)
  const [badges, setBadges] = useState<string[]>(["First Report", "Traffic Helper"])
  const [notifications, setNotifications] = useState(2)

  const addPoints = (newPoints: number) => {
    setPoints((prev) => {
      const total = prev + newPoints
      const newLevel = Math.floor(total / 500) + 1
      if (newLevel > level) {
        setLevel(newLevel)
        setNotifications((prev) => prev + 1)
      }
      return total
    })
  }

  const addBadge = (badge: string) => {
    setBadges((prev) => {
      if (!prev.includes(badge)) {
        setNotifications((prev) => prev + 1)
        return [...prev, badge]
      }
      return prev
    })
  }

  return (
    <GameContext.Provider
      value={{
        points,
        level,
        badges,
        notifications,
        addPoints,
        addBadge,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}
