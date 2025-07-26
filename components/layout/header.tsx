"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSocket } from "@/components/providers/socket-provider"
import { useGame } from "@/components/gamification/game-provider"
import { useNotifications } from "@/components/notifications/notification-provider"
import { RoleIndicator } from "@/components/role-indicator"
import { Bell, Trophy, Wifi, WifiOff } from "lucide-react"

export function Header() {
  const { isConnected, connectionStatus } = useSocket()
  const { points, level } = useGame()
  const { requestPermission } = useNotifications()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Smart Traffic Kottakkal</h1>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {connectionStatus}
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <RoleIndicator />
          
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Level {level}</span>
            <Badge variant="secondary">{points} pts</Badge>
          </div>

          <Button variant="outline" size="sm" onClick={requestPermission}>
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>
    </header>
  )
}
