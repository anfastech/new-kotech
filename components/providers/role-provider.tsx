"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"

export type UserRole = "client" | "ambulance-driver"

interface User {
  username: string
  role: UserRole
  isAuthenticated: boolean
}

interface RoleContextType {
  user: User | null
  currentRole: UserRole
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  switchToClient: () => void
  showLoginDialog: boolean
  setShowLoginDialog: (show: boolean) => void
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

// Mock ambulance driver credentials (in real app, this would be in a database)
const AMBULANCE_DRIVERS = [
  { username: "driver1", password: "ambulance123", name: "Driver 1" },
  { username: "driver2", password: "ambulance456", name: "Driver 2" },
  { username: "driver3", password: "ambulance789", name: "Driver 3" },
]

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<UserRole>("client")
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("kotech-user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        setCurrentRole(parsedUser.role)
      } catch (error) {
        console.error("Failed to parse saved user:", error)
        localStorage.removeItem("kotech-user")
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const driver = AMBULANCE_DRIVERS.find(
      d => d.username === username && d.password === password
    )
    
    if (driver) {
      const newUser: User = {
        username: driver.username,
        role: "ambulance-driver",
        isAuthenticated: true,
      }
      
      setUser(newUser)
      setCurrentRole("ambulance-driver")
      localStorage.setItem("kotech-user", JSON.stringify(newUser))
      setShowLoginDialog(false)
      return true
    }
    
    return false
  }

  const logout = () => {
    setUser(null)
    setCurrentRole("client")
    localStorage.removeItem("kotech-user")
  }

  const switchToClient = () => {
    setCurrentRole("client")
    if (user) {
      const updatedUser = { ...user, role: "client" as UserRole }
      setUser(updatedUser)
      localStorage.setItem("kotech-user", JSON.stringify(updatedUser))
    }
  }

  const isAuthenticated = user?.isAuthenticated || false

  return (
    <RoleContext.Provider value={{
      user,
      currentRole,
      isAuthenticated,
      login,
      logout,
      switchToClient,
      showLoginDialog,
      setShowLoginDialog,
    }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
} 