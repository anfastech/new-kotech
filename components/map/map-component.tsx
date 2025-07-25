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
  const [showRoutes, setShowRoutes] = useState(false)
  const [vehicleRoutes, setVehicleRoutes] = useState<{ [key: string]: any }>({})
  const routesRef = useRef<{ [key: string]: any }>({})

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

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!mapboxToken || mapboxToken === "your_mapbox_token_here") {
        setMapError("Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.")
        return
      }

      mapboxgl.accessToken = mapboxToken

      // Malappuram district bounds (approximate coordinates)
      const malappuramBounds = [
        [75.5, 10.8], // Southwest coordinates
        [76.2, 11.8]  // Northeast coordinates
      ]

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [75.7804, 11.2588], // Kottakkal coordinates (center of Malappuram)
        zoom: 10,
        maxBounds: malappuramBounds, // Restrict view to Malappuram
        maxZoom: 16, // Limit maximum zoom level
        minZoom: 8,  // Limit minimum zoom level
      })

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-left')

      // Add scale control
      map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
      }), 'bottom-left')

      // Restrict map movement to bounds
      map.on('moveend', () => {
        const center = map.getCenter()
        const bounds = map.getBounds()
        
        // Check if the view is within Malappuram bounds
        if (center.lng < malappuramBounds[0][0] || center.lng > malappuramBounds[1][0] ||
            center.lat < malappuramBounds[0][1] || center.lat > malappuramBounds[1][1]) {
          // If outside bounds, move back to center of Malappuram
          map.flyTo({
            center: [75.7804, 11.2588],
            zoom: 10,
            duration: 1000
          })
        }
      })

      map.on("load", () => {
        setIsMapLoaded(true)
        console.log("Map loaded successfully with Malappuram bounds")
        
        // Add a subtle border to show the district boundary
        map.addSource('malappuram-boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [75.5, 10.8], // Southwest
                [76.2, 10.8], // Southeast
                [76.2, 11.8], // Northeast
                [75.5, 11.8], // Northwest
                [75.5, 10.8]  // Close the polygon
              ]]
            }
          }
        })

        map.addLayer({
          id: 'malappuram-boundary-fill',
          type: 'fill',
          source: 'malappuram-boundary',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.05
          }
        })

        map.addLayer({
          id: 'malappuram-boundary-line',
          type: 'line',
          source: 'malappuram-boundary',
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
            'line-opacity': 0.3
          }
        })
      })

      map.on("error", (e: any) => {
        console.error("Map error:", e)
        setMapError("Map failed to load. Please check your Mapbox token.")
      })

      // Right-click for incident reporting
      map.on("contextmenu", (e: any) => {
        e.preventDefault()
        const lngLat = e.lngLat
        
        // Check if the clicked location is within Malappuram bounds
        if (lngLat.lng >= malappuramBounds[0][0] && lngLat.lng <= malappuramBounds[1][0] &&
            lngLat.lat >= malappuramBounds[0][1] && lngLat.lat <= malappuramBounds[1][1]) {
          setIncidentLocation([lngLat.lng, lngLat.lat])
          setShowIncidentModal(true)
        } else {
          // Show notification that location is outside Malappuram
          sendNotification("Location Error", "Incidents can only be reported within Malappuram district.")
        }
      })

      mapInstanceRef.current = map

      return () => {
        map.remove()
        mapInstanceRef.current = null
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError("Failed to initialize map. Please check your configuration.")
    }
  }, [isMapboxLoaded, sendNotification])

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
      
      // Only show vehicles within Malappuram bounds
      if (!isWithinMalappuramBounds(vehicle.coordinates)) {
        console.log(`Vehicle ${vehicle.id} outside Malappuram bounds, skipping`)
        return
      }

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
        
        // Show route for ambulances
        if (vehicle.type === 'ambulance') {
          calculateRoute(vehicle)
        }
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

  // Validate if coordinates are within Malappuram bounds
  const isWithinMalappuramBounds = (coordinates: [number, number]): boolean => {
    const malappuramBounds = [
      [75.5, 10.8], // Southwest coordinates
      [76.2, 11.8]  // Northeast coordinates
    ]
    
    return coordinates[0] >= malappuramBounds[0][0] && 
           coordinates[0] <= malappuramBounds[1][0] && 
           coordinates[1] >= malappuramBounds[0][1] && 
           coordinates[1] <= malappuramBounds[1][1]
  }

  // Reset map view to Malappuram center
  const resetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [75.7804, 11.2588], // Kottakkal coordinates (center of Malappuram)
        zoom: 10,
        duration: 1000
      })
    }
  }

  // Calculate route for a vehicle
  const calculateRoute = async (vehicle: Vehicle, destination?: [number, number]) => {
    if (!mapInstanceRef.current) return

    try {
      // If no destination provided, use a default destination in Kottakkal
      const endPoint = destination || [75.7854, 11.2638] // Default destination

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: vehicle.coordinates,
          end: endPoint,
          vehicle_type: vehicle.type,
          avoid_congestion: true
        })
      })

      const data = await response.json()
      
      if (data.success && data.route) {
        // Remove existing route for this vehicle
        if (routesRef.current[vehicle.id]) {
          mapInstanceRef.current.removeLayer(`route-${vehicle.id}`)
          mapInstanceRef.current.removeSource(`route-${vehicle.id}`)
        }

        // Add new route
        mapInstanceRef.current.addSource(`route-${vehicle.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: data.route.geometry
          }
        })

        const routeColor = vehicle.type === 'ambulance' ? '#ef4444' : 
                          vehicle.type === 'fire' ? '#f97316' : '#3b82f6'

        mapInstanceRef.current.addLayer({
          id: `route-${vehicle.id}`,
          type: 'line',
          source: `route-${vehicle.id}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': routeColor,
            'line-width': 4,
            'line-opacity': 0.8
          }
        })

        routesRef.current[vehicle.id] = {
          source: `route-${vehicle.id}`,
          layer: `route-${vehicle.id}`,
          data: data.route
        }

        setVehicleRoutes(prev => ({
          ...prev,
          [vehicle.id]: data.route
        }))

        // Fit map to show the entire route
        const coordinates = data.route.geometry.coordinates
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce((bounds: any, coord: [number, number]) => {
            return bounds.extend(coord)
          }, new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

          mapInstanceRef.current.fitBounds(bounds, {
            padding: 50,
            duration: 1000
          })
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      sendNotification('Route Error', 'Failed to calculate route for vehicle')
    }
  }

  // Toggle route display
  const toggleRoutes = () => {
    if (showRoutes) {
      // Remove all routes
      Object.keys(routesRef.current).forEach(vehicleId => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(`route-${vehicleId}`)
          mapInstanceRef.current.removeSource(`route-${vehicleId}`)
        }
      })
      routesRef.current = {}
      setVehicleRoutes({})
    } else {
      // Calculate routes for all ambulances
      vehicles.filter(v => v.type === 'ambulance').forEach(vehicle => {
        calculateRoute(vehicle)
      })
    }
    setShowRoutes(!showRoutes)
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

      {/* Malappuram District Indicator */}
      <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium text-blue-800">Malappuram District</span>
        </div>
        <div className="text-xs text-blue-600 mt-1">View restricted to district boundaries</div>
      </div>

      {/* Map Controls */}
      <MapControls
        vehicles={vehicles}
        visibleLayers={visibleLayers}
        onLayerToggle={(layer, visible) => setVisibleLayers((prev) => ({ ...prev, [layer]: visible }))}
        onResetView={resetMapView}
        showRoutes={showRoutes}
        onToggleRoutes={toggleRoutes}
      />

      {/* Traffic Legend */}
      <TrafficLegend showRoutes={showRoutes} />

      {/* Vehicle Info Panel */}
      {selectedVehicle && (
        <VehicleInfoPanel 
          vehicle={selectedVehicle} 
          onClose={() => setSelectedVehicle(null)}
          routeData={vehicleRoutes[selectedVehicle.id]}
          onShowRoute={() => selectedVehicle.type === 'ambulance' && calculateRoute(selectedVehicle)}
        />
      )}

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
