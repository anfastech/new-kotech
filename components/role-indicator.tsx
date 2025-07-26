"use client"

import { useRole } from "@/components/providers/role-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Ambulance, User, LogOut, Shield, Users } from "lucide-react"

export function RoleIndicator() {
  const { currentRole, user, logout, switchToClient, setShowLoginDialog } = useRole()

  const handleSwitchToDriver = () => {
    setShowLoginDialog(true)
  }

  const handleSwitchToClient = () => {
    switchToClient()
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Current Role Badge */}
      <Badge 
        variant={currentRole === "ambulance-driver" ? "destructive" : "secondary"}
        className="flex items-center space-x-1"
      >
        {currentRole === "ambulance-driver" ? (
          <>
            <Ambulance className="w-3 h-3" />
            <span>Driver</span>
          </>
        ) : (
          <>
            <Users className="w-3 h-3" />
            <span>Client</span>
          </>
        )}
      </Badge>

      {/* Role Switch Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2">
            <Shield className="w-3 h-3 mr-1" />
            Switch Role
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSwitchToClient}>
            <Users className="w-4 h-4 mr-2" />
            Switch to Client Mode
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSwitchToDriver}>
            <Ambulance className="w-4 h-4 mr-2" />
            Switch to Driver Mode
          </DropdownMenuItem>
          {user && (
            <>
              <DropdownMenuItem disabled className="text-xs text-gray-500">
                Logged in as: {user.username}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 