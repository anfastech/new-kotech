"use client"

import { useEffect, useRef, useState } from "react"
import { useSocket } from "@/components/providers/socket-provider"
import { MapControls } from "./map-controls"
import { VehicleInfoPanel } from "./vehicle-info-panel"
import { IncidentReportModal } from "./incident-report-modal"
import { TrafficLegend } from "./traffic-legend"
import { useNotifications } from "@/components/notifications/notification-provider"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  timestamp: number
}

interface Incident {
  id: string
  type: string
  coordinates: [number, number]
  description: string
  timestamp: number
}

export function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isMapboxLoaded, setIsMapboxLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(null)
  const [visibleLayers, setVisibleLayers] = useState({
    ambulance: true,
    fire: true,
    school_bus: true,
    city_bus: true,
    normal: true,
  })

  const { socket, isConnected, connectionStatus } = useSocket()
  const { sendNotification } = useNotifications()

  // Load Mapbox GL JS from CDN
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // Load CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
        document.head.appendChild(cssLink)

        // Load JS
        const script = document.createElement("script")
        script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        script.onload = () => {
          setIsMapboxLoaded(true)
        }
        script.onerror = () => {
          setMapError("Failed to load Mapbox GL JS")
        }
        document.head.appendChild(script)

        return () => {
          document.head.removeChild(cssLink)
          document.head.removeChild(script)
        }
      } catch (error) {
        setMapError("Error loading Mapbox GL JS")
      }
    }

    loadMapbox()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isMapboxLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      const mapboxgl = (window as any).mapboxgl
      if (!mapboxgl) {
        setMapError("Mapbox GL JS not available")
        return
      }

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test"

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [75.7804, 11.2588], // Kottakkal coordinates
        zoom: 14,
      })

      map.on("load", () => {
        setIsMapLoaded(true)
        console.log("Map loaded successfully")
      })

      map.on("error", (e: any) => {
        console.error("Map error:", e)
        setMapError("Map failed to load")
      })

      // Right-click for incident reporting
      map.on("contextmenu", (e: any) => {
        e.preventDefault()
        setIncidentLocation([e.lngLat.lng, e.lngLat.lat])
        setShowIncidentModal(true)
      })

      mapInstanceRef.current = map

      return () => {
        map.remove()
        mapInstanceRef.current = null
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError("Failed to initialize map")
    }
  }, [isMapboxLoaded])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleVehicleUpdate = (vehicle: Vehicle) => {
      setVehicles((prev) => {
        const updated = prev.filter((v) => v.id !== vehicle.id)
        return [...updated, vehicle]
      })
    }

    const handleVehiclesData = (vehiclesData: Vehicle[]) => {
      setVehicles(vehiclesData)
    }

    const handleEmergencyAlert = (alert: any) => {
      sendNotification("Emergency Alert", `${alert.type} reported at ${alert.location}`)
    }

    const handleTrafficAlert = (alert: any) => {
      sendNotification("Traffic Alert", `Heavy congestion detected on ${alert.road}`)
    }

    socket.on("vehicle-update", handleVehicleUpdate)
    socket.on("vehicles-data", handleVehiclesData)
    socket.on("emergency-alert", handleEmergencyAlert)
    socket.on("traffic-alert", handleTrafficAlert)

    return () => {
      socket.off("vehicle-update", handleVehicleUpdate)
      socket.off("vehicles-data", handleVehiclesData)
      socket.off("emergency-alert", handleEmergencyAlert)
      socket.off("traffic-alert", handleTrafficAlert)
    }
  }, [socket, sendNotification])

  // Update vehicle markers
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return

    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove())
    markersRef.current = {}

    // Add new markers
    vehicles.forEach((vehicle) => {
      if (!visibleLayers[vehicle.type]) return

      const color = getVehicleColor(vehicle.type)

      // Create marker element
      const el = document.createElement("div")
      el.className = "vehicle-marker"
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      `

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)"
      })

      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)"
      })

      const marker = new mapboxgl.Marker(el).setLngLat(vehicle.coordinates).addTo(mapInstanceRef.current)

      // Click handler
      el.addEventListener("click", () => {
        setSelectedVehicle(vehicle)
      })

      markersRef.current[vehicle.id] = marker
    })
  }, [vehicles, isMapLoaded, visibleLayers])

  const getVehicleColor = (type: string): string => {
    switch (type) {
      case "ambulance":
        return "#ef4444" // red
      case "fire":
        return "#f97316" // orange
      case "school_bus":
        return "#eab308" // yellow
      case "city_bus":
        return "#3b82f6" // blue
      case "normal":
        return "#6b7280" // gray
      default:
        return "#6b7280"
    }
  }

  const handleIncidentSubmit = (incident: Omit<Incident, "id" | "timestamp">) => {
    const newIncident: Incident = {
      ...incident,
      id: `incident-${Date.now()}`,
      timestamp: Date.now(),
    }

    if (socket) {
      socket.emit("incident-report", newIncident)
    }

    sendNotification("Incident Reported", `${incident.type} reported successfully`)
    setShowIncidentModal(false)
    setIncidentLocation(null)
  }

  if (mapError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Map Error</div>
          <div className="text-gray-600 mb-4">{mapError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isMapboxLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Mapbox GL JS...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* Connection Status */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "mock"
                  ? "bg-yellow-500"
                  : connectionStatus === "connecting"
                    ? "bg-blue-500 animate-pulse"
                    : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {connectionStatus === "connected"
              ? "Firebase Connected"
              : connectionStatus === "mock"
                ? "Mock Mode"
                : connectionStatus === "connecting"
                  ? "Connecting..."
                  : connectionStatus === "error"
                    ? "Connection Error"
                    : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Map Controls */}
      <MapControls
        vehicles={vehicles}
        visibleLayers={visibleLayers}
        onLayerToggle={(layer, visible) => setVisibleLayers((prev) => ({ ...prev, [layer]: visible }))}
      />

      {/* Traffic Legend */}
      <TrafficLegend />

      {/* Vehicle Info Panel */}
      {selectedVehicle && <VehicleInfoPanel vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />}

      {/* Incident Report Modal */}
      {showIncidentModal && incidentLocation && (
        <IncidentReportModal
          location={incidentLocation}
          onSubmit={handleIncidentSubmit}
          onClose={() => {
            setShowIncidentModal(false)
            setIncidentLocation(null)
          }}
        />
      )}
    </div>
  )
}
