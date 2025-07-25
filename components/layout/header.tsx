"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, Bell, Settings, User, Trophy } from "lucide-react"
import { useGame } from "@/components/gamification/game-provider"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { points, level, notifications } = useGame()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Smart Traffic Kottakkal</h1>
            <p className="text-sm text-gray-500">Real-time Traffic Management System</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div className="text-right">
              <div className="text-sm font-semibold">{points} pts</div>
              <div className="text-xs text-gray-500">Level {level}</div>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center">
                {notifications}
              </Badge>
            )}
          </Button>

          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="sm">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
