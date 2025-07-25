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
  const [mockData, setMockData] = useState<{
    vehicles: Record<string, any>;
    incidents: Record<string, any>;
    traffic: any;
  }>({
    vehicles: {},
    incidents: {},
    traffic: {},
  })

  useEffect(() => {
    // Check if Firebase config is available
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    }

    // Check if all required config is present
    const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => value && value !== "")

    if (hasFirebaseConfig) {
      initializeFirebase(firebaseConfig as FirebaseConfig)
    } else {
      console.warn("Firebase config not found, using mock mode")
      initializeMockMode()
    }
  }, [])

  const initializeFirebase = async (config: FirebaseConfig) => {
    try {
      // Use require for Firebase imports
      const { initializeApp } = require("firebase/app")
      const { getDatabase } = require("firebase/database")

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

  const publishVehicleUpdate = async (vehicle: any) => {
    if (database === "mock") {
      setMockData((prev) => ({
        ...prev,
        vehicles: { ...prev.vehicles, [vehicle.id]: vehicle },
      }))
    } else if (database) {
      try {
        // Use require for Firebase imports to avoid TypeScript issues
        const { ref, set, serverTimestamp } = require("firebase/database")
        const vehicleRef = ref(database, `vehicles/${vehicle.id}`)
        await set(vehicleRef, {
          ...vehicle,
          timestamp: serverTimestamp(),
        })
      } catch (error) {
        console.error("Failed to publish vehicle update:", error)
      }
    }
  }

  const publishIncidentUpdate = async (incident: any) => {
    if (database === "mock") {
      setMockData((prev) => ({
        ...prev,
        incidents: { ...prev.incidents, [incident.id]: incident },
      }))
    } else if (database) {
      try {
        const { ref, push, serverTimestamp } = require("firebase/database")
        const incidentsRef = ref(database, "incidents")
        await push(incidentsRef, {
          ...incident,
          timestamp: serverTimestamp(),
        })
      } catch (error) {
        console.error("Failed to publish incident update:", error)
      }
    }
  }

  const publishTrafficUpdate = async (traffic: any) => {
    if (database === "mock") {
      setMockData((prev) => ({
        ...prev,
        traffic: traffic,
      }))
    } else if (database) {
      try {
        const { ref, set, serverTimestamp } = require("firebase/database")
        const trafficRef = ref(database, "traffic")
        await set(trafficRef, {
          ...traffic,
          timestamp: serverTimestamp(),
        })
      } catch (error) {
        console.error("Failed to publish traffic update:", error)
      }
    }
  }

  const subscribeToVehicleUpdates = (callback: (data: any) => void) => {
    if (database === "mock") {
      // Mock subscription - return unsubscribe function
      return () => {}
    } else if (database) {
      try {
        const { ref, onValue } = require("firebase/database")
        const vehiclesRef = ref(database, "vehicles")
        const unsubscribe = onValue(vehiclesRef, (snapshot: any) => {
          const data = snapshot.val()
          callback(data || {})
        })
        return unsubscribe
      } catch (error) {
        console.error("Failed to subscribe to vehicle updates:", error)
        return () => {}
      }
    }
    return () => {}
  }

  const subscribeToIncidentUpdates = (callback: (data: any) => void) => {
    if (database === "mock") {
      // Mock subscription - return unsubscribe function
      return () => {}
    } else if (database) {
      try {
        const { ref, onValue } = require("firebase/database")
        const incidentsRef = ref(database, "incidents")
        const unsubscribe = onValue(incidentsRef, (snapshot: any) => {
          const data = snapshot.val()
          callback(data || {})
        })
        return unsubscribe
      } catch (error) {
        console.error("Failed to subscribe to incident updates:", error)
        return () => {}
      }
    }
    return () => {}
  }

  const subscribeToTrafficUpdates = (callback: (data: any) => void) => {
    if (database === "mock") {
      // Mock subscription - return unsubscribe function
      return () => {}
    } else if (database) {
      try {
        const { ref, onValue } = require("firebase/database")
        const trafficRef = ref(database, "traffic")
        const unsubscribe = onValue(trafficRef, (snapshot: any) => {
          const data = snapshot.val()
          callback(data || {})
        })
        return unsubscribe
      } catch (error) {
        console.error("Failed to subscribe to traffic updates:", error)
        return () => {}
      }
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
