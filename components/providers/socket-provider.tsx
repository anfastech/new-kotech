"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// Firebase configuration type
interface FirebaseConfig {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Socket context interface
interface SocketContextType {
  database: any
  isConnected: boolean
  publishVehicleUpdate: (vehicle: any) => void
  publishIncidentUpdate: (incident: any) => void
  publishTrafficUpdate: (traffic: any) => void
  subscribeToVehicleUpdates: (callback: (data: any) => void) => () => void
  subscribeToIncidentUpdates: (callback: (data: any) => void) => () => void
  subscribeToTrafficUpdates: (callback: (data: any) => void) => () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [database, setDatabase] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [mockData, setMockData] = useState<any>({
    vehicles: {},
    incidents: {},
    traffic: {},
  })

  useEffect(() => {
    // Check if Firebase config is available
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_SOCKET_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Check if all required config is present
    const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value && value !== "")

    if (hasFirebaseConfig) {
      initializeFirebase(firebaseConfig)
    } else {
      console.warn("Firebase config not found, using mock mode")
      initializeMockMode()
    }
  }, [])

  const initializeFirebase = async (config: FirebaseConfig) => {
    try {
      // Dynamically import Firebase
      const { initializeApp } = await import("firebase/app")
      const { getDatabase, ref, onValue, set, push } = await import("firebase/database")

      const app = initializeApp(config)
      const db = getDatabase(app)

      setDatabase(db)
      setIsConnected(true)

      console.log("Firebase initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Firebase:", error)
      initializeMockMode()
    }
  }

  const initializeMockMode = () => {
    setDatabase("mock")
    setIsConnected(true)
    console.log("Using mock mode for development")
  }

  const publishVehicleUpdate = (vehicle: any) => {
    if (database === "mock") {
      setMockData((prev) => ({
        ...prev,
        vehicles: { ...prev.vehicles, [vehicle.id]: vehicle },
      }))
    } else if (database) {
      // Firebase implementation would go here
      console.log("Publishing vehicle update:", vehicle)
    }
  }

  const publishIncidentUpdate = (incident: any) => {
    if (database === "mock") {
      setMockData((prev) => ({
        ...prev,
        incidents: { ...prev.incidents, [incident.id]: incident },
      }))
    } else if (database) {
      // Firebase implementation would go here
      console.log("Publishing incident update:", incident)
    }
  }

  const publishTrafficUpdate = (traffic: any) => {
    if (database === "mock") {
      setMockData((prev) => ({
        ...prev,
        traffic: traffic,
      }))
    } else if (database) {
      // Firebase implementation would go here
      console.log("Publishing traffic update:", traffic)
    }
  }

  const subscribeToVehicleUpdates = (callback: (data: any) => void) => {
    if (database === "mock") {
      // Mock subscription - return unsubscribe function
      return () => {}
    } else if (database) {
      // Firebase subscription would go here
      return () => {}
    }
    return () => {}
  }

  const subscribeToIncidentUpdates = (callback: (data: any) => void) => {
    if (database === "mock") {
      // Mock subscription - return unsubscribe function
      return () => {}
    } else if (database) {
      // Firebase subscription would go here
      return () => {}
    }
    return () => {}
  }

  const subscribeToTrafficUpdates = (callback: (data: any) => void) => {
    if (database === "mock") {
      // Mock subscription - return unsubscribe function
      return () => {}
    } else if (database) {
      // Firebase subscription would go here
      return () => {}
    }
    return () => {}
  }

  const value: SocketContextType = {
    database,
    isConnected,
    publishVehicleUpdate,
    publishIncidentUpdate,
    publishTrafficUpdate,
    subscribeToVehicleUpdates,
    subscribeToIncidentUpdates,
    subscribeToTrafficUpdates,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
