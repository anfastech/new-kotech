"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, onValue, set, push, off, type Database } from "firebase/database"

// Mock socket interface for compatibility
interface MockSocket {
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
  emit: (event: string, data: any) => void
}

interface SocketContextType {
  socket: MockSocket | null
  isConnected: boolean
  connectionStatus: "connecting" | "connected" | "disconnected" | "error" | "mock"
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: "disconnected",
})

export function useSocket() {
  return useContext(SocketContext)
}

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<MockSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error" | "mock"
  >("connecting")
  const [database, setDatabase] = useState<Database | null>(null)

  // Firebase configuration
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_SOCKET_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Check if Firebase is configured
  const isFirebaseConfigured = useCallback(() => {
    return !!(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.databaseURL &&
      firebaseConfig.projectId
    )
  }, [])

  // Mock data for development
                  const mockVehicles = [
                  { id: "amb-001", type: "ambulance", coordinates: [75.7804, 11.2588], status: "active", timestamp: Date.now() },
                  { id: "amb-002", type: "ambulance", coordinates: [75.7814, 11.2598], status: "emergency", timestamp: Date.now() },
                  { id: "fire-001", type: "fire", coordinates: [75.7824, 11.2608], status: "active", timestamp: Date.now() },
                  { id: "police-001", type: "police", coordinates: [75.7834, 11.2618], status: "patrolling", timestamp: Date.now() },
                  { id: "police-002", type: "police", coordinates: [75.7844, 11.2628], status: "responding", timestamp: Date.now() },
                  { id: "bus-001", type: "school_bus", coordinates: [75.7854, 11.2638], status: "active", timestamp: Date.now() },
                  { id: "bus-002", type: "city_bus", coordinates: [75.7864, 11.2648], status: "active", timestamp: Date.now() },
                  { id: "car-001", type: "normal", coordinates: [75.7874, 11.2658], status: "active", timestamp: Date.now() },
                ]

  // Create mock socket
  const createMockSocket = useCallback((): MockSocket => {
    const eventListeners: { [key: string]: ((data: any) => void)[] } = {}

    const mockSocket: MockSocket = {
      on: (event: string, callback: (data: any) => void) => {
        if (!eventListeners[event]) {
          eventListeners[event] = []
        }
        eventListeners[event].push(callback)
      },
      off: (event: string, callback?: (data: any) => void) => {
        if (eventListeners[event]) {
          if (callback) {
            eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback)
          } else {
            eventListeners[event] = []
          }
        }
      },
      emit: (event: string, data: any) => {
        console.log(`Mock emit: ${event}`, data)
      },
    }

    // Simulate vehicle updates
    const simulateVehicleUpdates = () => {
      mockVehicles.forEach((vehicle) => {
        // Simulate movement
        vehicle.coordinates[0] += (Math.random() - 0.5) * 0.001
        vehicle.coordinates[1] += (Math.random() - 0.5) * 0.001
        vehicle.timestamp = Date.now()

        if (eventListeners["vehicle-update"]) {
          eventListeners["vehicle-update"].forEach((callback) => {
            callback(vehicle)
          })
        }
      })
    }

    // Start simulation
    const interval = setInterval(simulateVehicleUpdates, 3000)

    // Initial data load
    setTimeout(() => {
      if (eventListeners["vehicles-data"]) {
        eventListeners["vehicles-data"].forEach((callback) => {
          callback(mockVehicles)
        })
      }
    }, 1000)

    return mockSocket
  }, [])

  // Initialize Firebase or mock
  useEffect(() => {
    let cleanup: (() => void) | null = null

    if (isFirebaseConfigured()) {
      try {
        setConnectionStatus("connecting")
        const app = initializeApp(firebaseConfig)
        const db = getDatabase(app)
        setDatabase(db)

        // Test connection
        const connectedRef = ref(db, ".info/connected")
        const unsubscribe = onValue(connectedRef, (snapshot) => {
          if (snapshot.val() === true) {
            setIsConnected(true)
            setConnectionStatus("connected")
            console.log("Firebase connected")
          } else {
            setIsConnected(false)
            setConnectionStatus("disconnected")
            console.log("Firebase disconnected")
          }
        })

        // Create Firebase socket wrapper
        const firebaseSocket: MockSocket = {
          on: (event: string, callback: (data: any) => void) => {
            const eventRef = ref(db, event)
            onValue(eventRef, (snapshot) => {
              const data = snapshot.val()
              if (data) callback(data)
            })
          },
          off: (event: string) => {
            const eventRef = ref(db, event)
            off(eventRef)
          },
          emit: (event: string, data: any) => {
            const eventRef = ref(db, event)
            if (event.includes("feed") || event.includes("alert")) {
              push(eventRef, data)
            } else {
              set(eventRef, data)
            }
          },
        }

        setSocket(firebaseSocket)
        cleanup = () => {
          unsubscribe()
          off(ref(db))
        }
      } catch (error) {
        console.error("Firebase initialization failed:", error)
        setConnectionStatus("error")
        // Fallback to mock
        setSocket(createMockSocket())
        setIsConnected(true)
        setConnectionStatus("mock")
      }
    } else {
      console.log("Firebase not configured, using mock mode")
      setSocket(createMockSocket())
      setIsConnected(true)
      setConnectionStatus("mock")
    }

    return () => {
      if (cleanup) cleanup()
    }
  }, [createMockSocket])

  return <SocketContext.Provider value={{ socket, isConnected, connectionStatus }}>{children}</SocketContext.Provider>
}
