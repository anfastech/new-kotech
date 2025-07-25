"use client"

import { useState } from "react"
import { MapComponent } from "@/components/map/map-component"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { GameProvider } from "@/components/gamification/game-provider"
import { SocketProvider } from "@/components/providers/socket-provider"

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SocketProvider>
      <NotificationProvider>
        <GameProvider>
          <div className="flex h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col overflow-hidden">
              <Header onMenuClick={() => setSidebarOpen(true)} />

              <main className="flex-1 relative overflow-hidden">
                <MapComponent />
              </main>
            </div>
          </div>
        </GameProvider>
      </NotificationProvider>
    </SocketProvider>
  )
}
