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

interface UserLocation {
  coordinates: [number, number]
  accuracy: number
  heading?: number
  speed?: number
  timestamp: number
}

export function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<{ [key: string]: any }>({})
  const userMarkerRef = useRef<any>(null)
  const userLocationWatchRef = useRef<number | null>(null)
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

  // User location states
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isTrackingUser, setIsTrackingUser] = useState(false)
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown")
  const [autoCenter, setAutoCenter] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

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

  // Check geolocation permission on mount
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setLocationPermission(result.state as "granted" | "denied" | "prompt")

          result.addEventListener("change", () => {
            setLocationPermission(result.state as "granted" | "denied" | "prompt")
          })
        })
        .catch(() => {
          setLocationPermission("unknown")
        })
    }
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
        [76.2, 11.8], // Northeast coordinates
      ]

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [75.7804, 11.2588], // Kottakkal coordinates (center of Malappuram)
        zoom: 14,
        maxBounds: malappuramBounds, // Restrict view to Malappuram
        maxZoom: 18, // Limit maximum zoom level
        minZoom: 10, // Limit minimum zoom level
      })

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-left")

      // Add scale control
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 80,
          unit: "metric",
        }),
        "bottom-left",
      )

      // Add geolocate control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
        showUserLocation: true,
      })

      map.addControl(geolocateControl, "top-left")

      // Listen to geolocate events
      geolocateControl.on("geolocate", (e: any) => {
        const newLocation: UserLocation = {
          coordinates: [e.coords.longitude, e.coords.latitude],
          accuracy: e.coords.accuracy,
          heading: e.coords.heading,
          speed: e.coords.speed,
          timestamp: Date.now(),
        }
        setUserLocation(newLocation)
        setLocationError(null)

        // Send notification on first location
        if (!userLocation) {
          sendNotification("Location Found", "Your current location has been detected")
        }
      })

      geolocateControl.on("trackuserlocationstart", () => {
        setIsTrackingUser(true)
        setAutoCenter(true)
      })

      geolocateControl.on("trackuserlocationend", () => {
        setIsTrackingUser(false)
        setAutoCenter(false)
      })

      geolocateControl.on("error", (e: any) => {
        console.error("Geolocation error:", e)
        setLocationError(e.message || "Failed to get location")
        setIsTrackingUser(false)
        sendNotification("Location Error", "Unable to access your location")
      })

      map.on("load", () => {
        setIsMapLoaded(true)
        console.log("Map loaded successfully with Malappuram bounds")

        // Add a subtle border to show the district boundary
        map.addSource("malappuram-boundary", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [75.5, 10.8], // Southwest
                  [76.2, 10.8], // Southeast
                  [76.2, 11.8], // Northeast
                  [75.5, 11.8], // Northwest
                  [75.5, 10.8], // Close the polygon
                ],
              ],
            },
          },
        })

        map.addLayer({
          id: "malappuram-boundary-fill",
          type: "fill",
          source: "malappuram-boundary",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.05,
          },
        })

        map.addLayer({
          id: "malappuram-boundary-line",
          type: "line",
          source: "malappuram-boundary",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-opacity": 0.3,
          },
        })

        // Auto-request location permission if not already granted
        if (locationPermission === "prompt" || locationPermission === "unknown") {
          setTimeout(() => {
            geolocateControl.trigger()
          }, 1000)
        }
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
        if (
          lngLat.lng >= malappuramBounds[0][0] &&
          lngLat.lng <= malappuramBounds[1][0] &&
          lngLat.lat >= malappuramBounds[0][1] &&
          lngLat.lat <= malappuramBounds[1][1]
        ) {
          setIncidentLocation([lngLat.lng, lngLat.lat])
          setShowIncidentModal(true)
        } else {
          // Show notification that location is outside Malappuram
          sendNotification("Location Error", "Incidents can only be reported within Malappuram district.")
        }
      })

      mapInstanceRef.current = map

      return () => {
        if (userLocationWatchRef.current) {
          navigator.geolocation.clearWatch(userLocationWatchRef.current)
        }
        map.remove()
        mapInstanceRef.current = null
      }
    } catch (error) {
      console.error("Error initializing map:", error)
      setMapError("Failed to initialize map. Please check your configuration.")
    }
  }, [isMapboxLoaded, sendNotification, locationPermission, userLocation])

  // Manual location tracking using browser geolocation API
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      sendNotification("Location Error", "Geolocation is not supported by this browser")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }

    const successCallback = (position: GeolocationPosition) => {
      const newLocation: UserLocation = {
        coordinates: [position.coords.longitude, position.coords.latitude],
        accuracy: position.coords.accuracy,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: Date.now(),
      }

      setUserLocation(newLocation)
      setLocationError(null)

      // Update custom user marker
      updateUserLocationMarker(newLocation)

      // Auto-center map if enabled
      if (autoCenter && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({
          center: newLocation.coordinates,
          zoom: 16,
          duration: 1000,
        })
      }

      // Send location to Firebase if connected
      if (socket) {
        socket.emit("user-location-update", {
          userId: "current-user",
          location: newLocation,
        })
      }
    }

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = "Unknown location error"
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          setLocationPermission("denied")
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }

      setLocationError(errorMessage)
      setIsTrackingUser(false)
      sendNotification("Location Error", errorMessage)
    }

    // Get current position first
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options)
    userLocationWatchRef.current = watchId
    setIsTrackingUser(true)
  }

  // Stop location tracking
  const stopLocationTracking = () => {
    if (userLocationWatchRef.current) {
      navigator.geolocation.clearWatch(userLocationWatchRef.current)
      userLocationWatchRef.current = null
    }
    setIsTrackingUser(false)
    setAutoCenter(false)

    // Remove custom user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
  }

  // Update user location marker
  const updateUserLocationMarker = (location: UserLocation) => {
    if (!mapInstanceRef.current) return

    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return

    // Remove existing marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
    }

    // Create user location marker element
    const el = document.createElement("div")
    el.className = "user-location-marker"
    el.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      position: relative;
      animation: pulse 2s infinite;
    `

    // Add pulsing animation
    const style = document.createElement("style")
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    `
    document.head.appendChild(style)

    // Add direction indicator if heading is available
    if (location.heading !== undefined && location.heading !== null) {
      const arrow = document.createElement("div")
      arrow.style.cssText = `
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%) rotate(${location.heading}deg);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 8px solid #3b82f6;
      `
      el.appendChild(arrow)
    }

    // Create marker
    const marker = new mapboxgl.Marker(el).setLngLat(location.coordinates).addTo(mapInstanceRef.current)

    // Add popup with location info
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">Your Location</h3>
          <p class="text-xs text-gray-600">Accuracy: ${Math.round(location.accuracy)}m</p>
          ${location.speed ? `<p class="text-xs text-gray-600">Speed: ${Math.round(location.speed * 3.6)} km/h</p>` : ""}
          <p class="text-xs text-gray-500">${new Date(location.timestamp).toLocaleTimeString()}</p>
        </div>
      `)

    marker.setPopup(popup)
    userMarkerRef.current = marker
  }

  // Toggle auto-center
  const toggleAutoCenter = () => {
    setAutoCenter(!autoCenter)
    if (!autoCenter && userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: userLocation.coordinates,
        zoom: 16,
        duration: 1000,
      })
    }
  }

  // Center map on user location
  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: userLocation.coordinates,
        zoom: 16,
        duration: 1000,
      })
    } else if (!userLocation) {
      sendNotification("Location Error", "User location not available")
    }
  }

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
        if (vehicle.type === "ambulance") {
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
      [76.2, 11.8], // Northeast coordinates
    ]

    return (
      coordinates[0] >= malappuramBounds[0][0] &&
      coordinates[0] <= malappuramBounds[1][0] &&
      coordinates[1] >= malappuramBounds[0][1] &&
      coordinates[1] <= malappuramBounds[1][1]
    )
  }

  // Reset map view to Malappuram center
  const resetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [75.7804, 11.2588], // Kottakkal coordinates (center of Malappuram)
        zoom: 14,
        duration: 1000,
      })
    }
  }

  // Calculate route for a vehicle
  const calculateRoute = async (vehicle: Vehicle, destination?: [number, number]) => {
    if (!mapInstanceRef.current) return

    try {
      // If no destination provided, use a default destination in Kottakkal
      const endPoint = destination || [75.7854, 11.2638] // Default destination

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: vehicle.coordinates,
          end: endPoint,
          vehicle_type: vehicle.type,
          avoid_congestion: true,
        }),
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
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: data.route.geometry,
          },
        })

        const routeColor = vehicle.type === "ambulance" ? "#ef4444" : vehicle.type === "fire" ? "#f97316" : "#3b82f6"

        mapInstanceRef.current.addLayer({
          id: `route-${vehicle.id}`,
          type: "line",
          source: `route-${vehicle.id}`,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": routeColor,
            "line-width": 4,
            "line-opacity": 0.8,
          },
        })

        routesRef.current[vehicle.id] = {
          source: `route-${vehicle.id}`,
          layer: `route-${vehicle.id}`,
          data: data.route,
        }

        setVehicleRoutes((prev) => ({
          ...prev,
          [vehicle.id]: data.route,
        }))

        // Fit map to show the entire route
        const coordinates = data.route.geometry.coordinates
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => {
              return bounds.extend(coord)
            },
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
          )

          mapInstanceRef.current.fitBounds(bounds, {
            padding: 50,
            duration: 1000,
          })
        }
      }
    } catch (error) {
      console.error("Error calculating route:", error)
      sendNotification("Route Error", "Failed to calculate route for vehicle")
    }
  }

  // Toggle route display
  const toggleRoutes = () => {
    if (showRoutes) {
      // Remove all routes
      Object.keys(routesRef.current).forEach((vehicleId) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(`route-${vehicleId}`)
          mapInstanceRef.current.removeSource(`route-${vehicleId}`)
        }
      })
      routesRef.current = {}
      setVehicleRoutes({})
    } else {
      // Calculate routes for all ambulances
      vehicles
        .filter((v) => v.type === "ambulance")
        .forEach((vehicle) => {
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

      {/* User Location Controls */}
      <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Location Tracking</span>
          <div className={`w-3 h-3 rounded-full ${isTrackingUser ? "bg-green-500" : "bg-gray-400"}`} />
        </div>

        {userLocation && (
          <div className="text-xs text-gray-600">
            <div>Accuracy: {Math.round(userLocation.accuracy)}m</div>
            {userLocation.speed && <div>Speed: {Math.round(userLocation.speed * 3.6)} km/h</div>}
          </div>
        )}

        {locationError && <div className="text-xs text-red-600">{locationError}</div>}

        <div className="flex flex-col space-y-1">
          <button
            onClick={isTrackingUser ? stopLocationTracking : startLocationTracking}
            className={`px-3 py-1 text-xs rounded ${
              isTrackingUser ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isTrackingUser ? "Stop Tracking" : "Start Tracking"}
          </button>

          {userLocation && (
            <>
              <button
                onClick={centerOnUser}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Center on Me
              </button>

              <button
                onClick={toggleAutoCenter}
                className={`px-3 py-1 text-xs rounded ${
                  autoCenter
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                Auto-Center: {autoCenter ? "ON" : "OFF"}
              </button>
            </>
          )}
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
        userLocation={userLocation}
        isTrackingUser={isTrackingUser}
        onStartTracking={startLocationTracking}
        onStopTracking={stopLocationTracking}
        onCenterOnUser={centerOnUser}
        autoCenter={autoCenter}
        onToggleAutoCenter={toggleAutoCenter}
      />

      {/* Traffic Legend */}
      <TrafficLegend showRoutes={showRoutes} />

      {/* Vehicle Info Panel */}
      {selectedVehicle && (
        <VehicleInfoPanel
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          routeData={vehicleRoutes[selectedVehicle.id]}
          onShowRoute={() => selectedVehicle.type === "ambulance" && calculateRoute(selectedVehicle)}
          userLocation={userLocation}
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
          userLocation={userLocation}
        />
      )}
    </div>
  )
}
