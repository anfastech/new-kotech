"use client"

import { SocketProvider } from "@/components/providers/socket-provider"
import { GameProvider } from "@/components/gamification/game-provider"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MapComponent } from "@/components/map/map-component"

export default function HomePage() {
  return (
    <SocketProvider>
      <GameProvider>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex">
            <Sidebar />
            <MapComponent />
          </div>
        </div>
      </GameProvider>
    </SocketProvider>
  )
}
