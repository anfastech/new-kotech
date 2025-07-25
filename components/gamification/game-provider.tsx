"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface GameContextType {
  points: number
  level: number
  badges: string[]
  addPoints: (points: number) => void
  addBadge: (badge: string) => void
}

const GameContext = createContext<GameContextType>({
  points: 0,
  level: 1,
  badges: [],
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
  const [points, setPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [badges, setBadges] = useState<string[]>([])

  // Calculate level based on points
  useEffect(() => {
    const newLevel = Math.floor(points / 100) + 1
    setLevel(newLevel)
  }, [points])

  const addPoints = (newPoints: number) => {
    setPoints((prev) => prev + newPoints)
  }

  const addBadge = (badge: string) => {
    setBadges((prev) => [...prev, badge])
  }

  return <GameContext.Provider value={{ points, level, badges, addPoints, addBadge }}>{children}</GameContext.Provider>
}
