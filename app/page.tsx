"use client"

import { SocketProvider } from "@/components/providers/socket-provider"
import { GameProvider } from "@/components/gamification/game-provider"
import { MapProvider } from "@/components/providers/map-provider"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MapComponent } from "@/components/map/map-component"
import { GlobalSettingsModal } from "@/components/global-settings-modal"

export default function HomePage() {
  return (
    <SocketProvider>
      <GameProvider>
        <MapProvider>
          <div className="h-screen flex flex-col">
            <Header />
            <div className="flex-1 flex">
              <Sidebar />
              <MapComponent />
            </div>
            <GlobalSettingsModal />
          </div>
        </MapProvider>
      </GameProvider>
    </SocketProvider>
  )
}
