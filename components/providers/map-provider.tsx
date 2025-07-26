"use client"

import { createContext, useContext, useState, useRef, ReactNode } from "react"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "police" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  timestamp: number
}

interface UserLocation {
  coordinates: [number, number]
  accuracy: number
  heading?: number
  speed?: number
  timestamp: number
}

interface VisibleLayers {
  ambulance: boolean
  fire: boolean
  police: boolean
  school_bus: boolean
  city_bus: boolean
  normal: boolean
}

interface MapContextType {
  vehicles: Vehicle[]
  setVehicles: (vehicles: Vehicle[]) => void
  visibleLayers: VisibleLayers
  setVisibleLayers: (layers: VisibleLayers) => void
  userLocation: UserLocation | null
  setUserLocation: (location: UserLocation | null) => void
  isTrackingUser: boolean
  setIsTrackingUser: (tracking: boolean) => void
  autoCenter: boolean
  setAutoCenter: (center: boolean) => void
  showRoutes: boolean
  setShowRoutes: (routes: boolean) => void
  // Functions
  onLayerToggle: (layer: keyof VisibleLayers, visible: boolean) => void
  onStartTracking: () => void
  onStopTracking: () => void
  onCenterOnUser: () => void
  onToggleAutoCenter: (checked: boolean) => void
  onToggleRoutes: () => void
  onResetView: () => void
  // Set function references
  setMapFunctions: (functions: {
    onLayerToggle: (layer: keyof VisibleLayers, visible: boolean) => void
    onStartTracking: () => void
    onStopTracking: () => void
    onCenterOnUser: () => void
    onToggleAutoCenter: (checked: boolean) => void
    onToggleRoutes: () => void
    onResetView: () => void
  }) => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>({
    ambulance: true,
    fire: false,
    police: false,
    school_bus: false,
    city_bus: false,
    normal: false,
  })
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isTrackingUser, setIsTrackingUser] = useState(false)
  const [autoCenter, setAutoCenter] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  
  // Function references (will be set by MapComponent) - using ref to prevent infinite loops
  const mapFunctionsRef = useRef({
    onLayerToggle: (layer: keyof VisibleLayers, visible: boolean) => {},
    onStartTracking: () => {},
    onStopTracking: () => {},
    onCenterOnUser: () => {},
    onToggleAutoCenter: (checked: boolean) => {},
    onToggleRoutes: () => {},
    onResetView: () => {},
  })

  const onLayerToggle = (layer: keyof VisibleLayers, visible: boolean) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: visible }))
    mapFunctionsRef.current.onLayerToggle(layer, visible)
  }

  const onStartTracking = () => {
    setIsTrackingUser(true)
    mapFunctionsRef.current.onStartTracking()
  }

  const onStopTracking = () => {
    setIsTrackingUser(false)
    mapFunctionsRef.current.onStopTracking()
  }

  const onCenterOnUser = () => {
    mapFunctionsRef.current.onCenterOnUser()
  }

  const onToggleAutoCenter = (checked: boolean) => {
    setAutoCenter(checked)
    mapFunctionsRef.current.onToggleAutoCenter(checked)
  }

  const onToggleRoutes = () => {
    setShowRoutes(!showRoutes)
    mapFunctionsRef.current.onToggleRoutes()
  }

  const onResetView = () => {
    mapFunctionsRef.current.onResetView()
  }

  const setMapFunctionsRef = (functions: typeof mapFunctionsRef.current) => {
    mapFunctionsRef.current = functions
  }

  return (
    <MapContext.Provider value={{
      vehicles,
      setVehicles,
      visibleLayers,
      setVisibleLayers,
      userLocation,
      setUserLocation,
      isTrackingUser,
      setIsTrackingUser,
      autoCenter,
      setAutoCenter,
      showRoutes,
      setShowRoutes,
      onLayerToggle,
      onStartTracking,
      onStopTracking,
      onCenterOnUser,
      onToggleAutoCenter,
      onToggleRoutes,
      onResetView,
      setMapFunctions: setMapFunctionsRef,
    }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider')
  }
  return context
} 