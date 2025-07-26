"use client"

import { SocketProvider } from "@/components/providers/socket-provider"
import { GameProvider } from "@/components/gamification/game-provider"
import { MapProvider } from "@/components/providers/map-provider"
import { RoleProvider } from "@/components/providers/role-provider"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MapComponent } from "@/components/map/map-component"
import { GlobalSettingsModal } from "@/components/global-settings-modal"
import { RoleLoginDialog } from "@/components/role-login-dialog"
import { RoleOverlay } from "@/components/role-overlay"

export default function HomePage() {
  return (
    <SocketProvider>
      <GameProvider>
        <MapProvider>
          <RoleProvider>
            <div className="h-screen flex flex-col">
              <Header />
              <div className="flex-1 flex">
                <Sidebar />
                <MapComponent />
              </div>
              <GlobalSettingsModal />
              <RoleLoginDialog />
              <RoleOverlay />
            </div>
          </RoleProvider>
        </MapProvider>
      </GameProvider>
    </SocketProvider>
  )
}
