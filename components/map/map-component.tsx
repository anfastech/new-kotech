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
    fire: false,
    school_bus: false,
    city_bus: false,
    normal: false,
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

  // ---- Mapbox & Geolocation setup ----

  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // CSS
        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
        document.head.appendChild(cssLink)
        // JS
        const script = document.createElement("script")
        script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
        script.onload = () => setIsMapboxLoaded(true)
        script.onerror = () => setMapError("Failed to load Mapbox GL JS")
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

  // Geolocation permission
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setLocationPermission(result.state as any)
          result.addEventListener("change", () => {
            setLocationPermission(result.state as any)
          })
        })
        .catch(() => setLocationPermission("unknown"))
    }
  }, [])

  // ---- Map Initialization ----

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

      // District Bounds for Malappuram
      const malappuramBounds = [
        [75.9988, 11.0001], [76.0029, 11.0016] // NE
      ]
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [75.95, 11.22],
        zoom: 12,
        maxBounds: malappuramBounds,
        maxZoom: 18,
        minZoom: 10,
      })
      map.addControl(new mapboxgl.NavigationControl(), "top-left")
      map.addControl(new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" }), "bottom-left")

      // Geolocate Control
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
        showUserLocation: true,
      })
      map.addControl(geolocateControl, "top-left")
      mapInstanceRef.current = map

      geolocateControl.on("geolocate", (e: any) => {
        const newLoc: UserLocation = {
          coordinates: [e.coords.longitude, e.coords.latitude],
          accuracy: e.coords.accuracy,
          heading: e.coords.heading,
          speed: e.coords.speed,
          timestamp: Date.now(),
        }
        setUserLocation(newLoc)
        setLocationError(null)
        if (!userLocation) sendNotification("Location Found", "Your current location has been detected")
      })
      geolocateControl.on("trackuserlocationstart", () => { setIsTrackingUser(true); setAutoCenter(true) })
      geolocateControl.on("trackuserlocationend", () => { setIsTrackingUser(false); setAutoCenter(false) })
      geolocateControl.on("error", (e: any) => {
        setLocationError(e.message || "Failed to get location")
        setIsTrackingUser(false)
        sendNotification("Location Error", "Unable to access your location")
      })

      map.on("load", () => {
        setIsMapLoaded(true)
        // District border
        map.addSource("malappuram-boundary", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[
                [75.9988, 11.0001],  // Southwest (bottom-left)
                [76.0029, 11.0001],  // Southeast (bottom-right)
                [76.0029, 11.0016],  // Northeast (top-right)
                [75.9988, 11.0016],  // Northwest (top-left)
                [75.9988, 11.0001]   // Close the polygon
              ]]
            }
          }
        })
        map.addLayer({
          id: "malappuram-boundary-fill",
          type: "fill",
          source: "malappuram-boundary",
          paint: { "fill-color": "#3b82f6", "fill-opacity": 0.05 }
        })
        map.addLayer({
          id: "malappuram-boundary-line",
          type: "line",
          source: "malappuram-boundary",
          paint: { "line-color": "#3b82f6", "line-width": 2, "line-opacity": 0.3 }
        })
        if (locationPermission === "prompt" || locationPermission === "unknown") {
          setTimeout(() => geolocateControl.trigger(), 1000)
        }
      })

      map.on("contextmenu", (e: any) => {
        e.preventDefault()
        const lngLat = e.lngLat
        if (
          lngLat.lng >= malappuramBounds[0][0] &&
          lngLat.lng <= malappuramBounds[1][0] &&
          lngLat.lat >= malappuramBounds[0][1] &&
          lngLat.lat <= malappuramBounds[1][1]
        ) {
          setIncidentLocation([lngLat.lng, lngLat.lat])
          setShowIncidentModal(true)
        } else {
          sendNotification("Location Error", "Incidents can only be reported within Malappuram district.")
        }
      })

      map.on("error", (e: any) => {
        setMapError("Map failed to load. Please check your Mapbox token.")
      })

      return () => {
        if (userLocationWatchRef.current) navigator.geolocation.clearWatch(userLocationWatchRef.current)
        map.remove()
        mapInstanceRef.current = null
      }
    } catch (error) {
      setMapError("Failed to initialize map. Please check your configuration.")
    }
  }, [isMapboxLoaded, sendNotification, locationPermission, userLocation])

  // ---- Geolocation Tracker ----

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      sendNotification("Location Error", "Geolocation is not supported by this browser")
      return
    }
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    const success = (pos: GeolocationPosition) => {
      const newLoc: UserLocation = {
        coordinates: [pos.coords.longitude, pos.coords.latitude],
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading || undefined,
        speed: pos.coords.speed || undefined,
        timestamp: Date.now(),
      }
      setUserLocation(newLoc)
      setLocationError(null)
      updateUserLocationMarker(newLoc)
      if (autoCenter && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ center: newLoc.coordinates, zoom: 16, duration: 1000 })
      }
      if (socket) socket.emit("user-location-update", { userId: "current-user", location: newLoc })
    }
    const error = (error: GeolocationPositionError) => {
      let msg = "Unknown error"
      switch (error.code) {
        case error.PERMISSION_DENIED: msg = "Location access denied by user"; setLocationPermission("denied"); break
        case error.POSITION_UNAVAILABLE: msg = "Location unavailable"; break
        case error.TIMEOUT: msg = "Location request timed out"; break
      }
      setLocationError(msg)
      setIsTrackingUser(false)
      sendNotification("Location Error", msg)
    }
    navigator.geolocation.getCurrentPosition(success, error, options)
    const watchId = navigator.geolocation.watchPosition(success, error, options)
    userLocationWatchRef.current = watchId
    setIsTrackingUser(true)
  }

  const stopLocationTracking = () => {
    if (userLocationWatchRef.current) {
      navigator.geolocation.clearWatch(userLocationWatchRef.current)
      userLocationWatchRef.current = null
    }
    setIsTrackingUser(false)
    setAutoCenter(false)
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
  }

  // ---- User Marker ----

  const isWithinMalappuramBounds = (coordinates: [number, number]) => {
    // Malappuram bbox
    const malappuramBounds = [
      [75.78, 11.0], // SW
      [76.12, 11.45], // NE
    ]
    const [lng, lat] = coordinates
    return (
      lng >= malappuramBounds[0][0] &&
      lng <= malappuramBounds[1][0] &&
      lat >= malappuramBounds[0][1] &&
      lat <= malappuramBounds[1][1]
    )
  }

  const updateUserLocationMarker = (location: UserLocation) => {
    if (!mapInstanceRef.current) return
    if (!isWithinMalappuramBounds(location.coordinates)) {
      setLocationError("Location is outside Malappuram district")
      sendNotification("Location Error", "You appear to be outside Malappuram district")
      return
    }
    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return
    // Remove previous
    if (userMarkerRef.current) userMarkerRef.current.remove()

    // Marker visual
    const el = document.createElement("div")
    el.className = "user-location-marker"
    el.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: radial-gradient(circle, #3b82f6 40%, rgba(59, 130, 246, 0.3) 70%);
      border: 3px solid white;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
      position: relative; cursor: pointer;
    `
    // Pulsing ring
    const ring = document.createElement("div")
    ring.style.cssText = `
      position: absolute;
      top: -6px; left: -6px;
      width: 36px; height: 36px;
      border: 2px solid rgba(59, 130, 246, 0.4);
      border-radius: 50%; animation: pulse 2s infinite;
    `
    el.appendChild(ring)
    if (location.heading !== undefined && location.heading !== null) {
      const arrow = document.createElement("div")
      arrow.style.cssText = `
        position: absolute; top: -12px; left: 50%;
        transform: translateX(-50%) rotate(${location.heading}deg);
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 12px solid #3b82f6;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      `
      el.appendChild(arrow)
    }

    const marker = new mapboxgl.Marker(el).setLngLat(location.coordinates).addTo(mapInstanceRef.current)
    const popup = new mapboxgl.Popup({
      offset: 30,
      closeButton: true,
      closeOnClick: false,
    }).setHTML(`
      <div class="p-3 min-w-[200px]">
        <h3 class="font-semibold text-sm mb-2 text-blue-600">📍 Your Location</h3>
        <div class="space-y-1 text-xs">
          <div><strong>Coordinates:</strong> ${location.coordinates[1].toFixed(6)}, ${location.coordinates[0].toFixed(6)}</div>
          <div><strong>Accuracy:</strong> ±${Math.round(location.accuracy)}m</div>
          ${location.speed ? `<div><strong>Speed:</strong> ${Math.round(location.speed * 3.6)} km/h</div>` : ""}
          ${location.heading ? `<div><strong>Heading:</strong> ${Math.round(location.heading)}°</div>` : ""}
          <div><strong>Updated:</strong> ${new Date(location.timestamp).toLocaleTimeString()}</div>
        </div>
        <div class="mt-2 pt-2 border-t text-xs text-gray-600">
          <div>✅ Within Malappuram District</div>
          <div>🛣️ Available for routing</div>
        </div>
      </div>
    `)

    marker.setPopup(popup)
    setTimeout(() => {
      popup.addTo(mapInstanceRef.current)
      setTimeout(() => popup.remove(), 3000)
    }, 500)
    userMarkerRef.current = marker
  }

  // ---- UI Controls ----

  const toggleAutoCenter = () => {
    setAutoCenter(!autoCenter)
    if (!autoCenter && userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: userLocation.coordinates, zoom: 16, duration: 1000,
      })
    }
  }

  const centerOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: userLocation.coordinates, zoom: 16, duration: 1000,
      })
    } else if (!userLocation) {
      sendNotification("Location Error", "User location not available")
    }
  }

  // ---- Vehicles ----

  useEffect(() => {
    if (!socket) return
    const handleVehicleUpdate = (vehicle: Vehicle) => {
      setVehicles((prev) => {
        const updated = prev.filter((v) => v.id !== vehicle.id)
        return [...updated, vehicle]
      })
    }
    const handleVehiclesData = (vehiclesData: Vehicle[]) => setVehicles(vehiclesData)
    const handleEmergencyAlert = (alert: any) =>
      sendNotification("Emergency Alert", `${alert.type} reported at ${alert.location}`)
    const handleTrafficAlert = (alert: any) =>
      sendNotification("Traffic Alert", `Heavy congestion detected on ${alert.road}`)
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

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return
    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return
    // Clear existing
    Object.values(markersRef.current).forEach((marker: any) => marker.remove())
    markersRef.current = {}
    vehicles.forEach((vehicle) => {
      if (!visibleLayers[vehicle.type]) return
      if (!isWithinMalappuramBounds(vehicle.coordinates)) return
      const color = getVehicleColor(vehicle.type)
      const el = document.createElement("div")
      el.className = "vehicle-marker"
      el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer; transition: transform 0.2s;
      `
      el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.2)"))
      el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"))
      const marker = new mapboxgl.Marker(el)
        .setLngLat(vehicle.coordinates)
        .addTo(mapInstanceRef.current)
      el.addEventListener("click", () => {
        setSelectedVehicle(vehicle)
        if (vehicle.type === "ambulance") calculateRoute(vehicle)
      })
      markersRef.current[vehicle.id] = marker
    })
  }, [vehicles, isMapLoaded, visibleLayers])

  const getVehicleColor = (type: string): string => {
    switch (type) {
      case "ambulance": return "#ef4444"
      case "fire": return "#f97316"
      case "school_bus": return "#eab308"
      case "city_bus": return "#3b82f6"
      case "normal": return "#6b7280"
      default: return "#6b7280"
    }
  }

  // ---- Map Controls / Routing ----

  // "Navigate to Kottakkal" coords
  const kottakkalDest: [number, number] = [75.9988, 11.0001]

  const calculateRoute = async (vehicle: Vehicle, destination?: [number, number]) => {
    if (!mapInstanceRef.current) return
    const endPoint = destination || kottakkalDest
    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: vehicle.coordinates,
          end: endPoint,
          vehicle_type: vehicle.type,
          avoid_congestion: true,
        }),
      })
      const data = await response.json()
      if (data.success && data.route) {
        if (routesRef.current[vehicle.id]) {
          mapInstanceRef.current.removeLayer(`route-${vehicle.id}`)
          mapInstanceRef.current.removeSource(`route-${vehicle.id}`)
        }
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
          layout: { "line-join": "round", "line-cap": "round" },
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
        // Fit map to route
        const coordinates = data.route.geometry.coordinates
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => bounds.extend(coord),
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: 50, duration: 1000 })
        }
      }
    } catch (error) {
      sendNotification("Route Error", "Failed to calculate route for vehicle")
    }
  }

  const calculateRouteFromUser = async (destination: [number, number], vehicleType = "normal") => {
    if (!userLocation || !mapInstanceRef.current) {
      sendNotification("Route Error", "Your location is required for routing")
      return null
    }
    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: userLocation.coordinates,
          end: destination,
          vehicle_type: vehicleType,
          avoid_congestion: true,
          user_location: true,
        }),
      })
      const data = await response.json()
      if (data.success && data.route) {
        const routeId = `user-route-${Date.now()}`
        mapInstanceRef.current.addSource(routeId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: data.route.geometry,
          },
        })
        mapInstanceRef.current.addLayer({
          id: routeId,
          type: "line",
          source: routeId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#10b981",
            "line-width": 4,
            "line-opacity": 0.8,
            "line-dasharray": [2, 2],
          },
        })
        const coordinates = data.route.geometry.coordinates
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => bounds.extend(coord),
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: 50, duration: 1000 })
        }
        sendNotification("Navigation", "Route to Kottakkal set")
        return data.route
      }
    } catch (error) {
      sendNotification("Route Error", "Failed to calculate route from your location")
    }
    return null
  }

  const toggleRoutes = () => {
    if (showRoutes) {
      Object.keys(routesRef.current).forEach((vehicleId) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(`route-${vehicleId}`)
          mapInstanceRef.current.removeSource(`route-${vehicleId}`)
        }
      })
      routesRef.current = {}
      setVehicleRoutes({})
    } else {
      vehicles
        .filter((v) => v.type === "ambulance")
        .forEach((v) => calculateRoute(v))
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

  // Map reset for Kottakkal or default Malappuram
  const resetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [75.9988, 11.0001], // Kottakkal or central Malappuram
        zoom: 14,
        duration: 1000,
      })
    }
  }

  // ---- RENDER ----

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
            className={`w-3 h-3 rounded-full ${connectionStatus === "connected"
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
            className={`px-3 py-1 text-xs rounded ${isTrackingUser ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
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
                className={`px-3 py-1 text-xs rounded ${autoCenter
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                  }`}
              >
                Auto-Center: {autoCenter ? "ON" : "OFF"}
              </button>
              {/* --- Navigate to Kottakkal --- */}
              <button
                onClick={() => calculateRouteFromUser(kottakkalDest)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Navigate to Kottakkal
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

      {/* Supplementary Controls Duplicate Panel? (optional, can remove if redundant with above) */}
      <div className="absolute top-4 left-64 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTrackingUser ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm font-medium">
              {isTrackingUser ? 'Location Active' : 'Location Inactive'}
            </span>
          </div>
          <button
            onClick={isTrackingUser ? stopLocationTracking : startLocationTracking}
            className={`px-3 py-1 text-xs rounded ${isTrackingUser
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            {isTrackingUser ? 'Stop' : 'Start'}
          </button>
        </div>
        {userLocation && (
          <div className="text-xs text-gray-600 mt-1">
            <div>Coordinates: {userLocation.coordinates[1].toFixed(4)}, {userLocation.coordinates[0].toFixed(4)}</div>
            <div>Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
            <div>Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}</div>
          </div>
        )}
        {locationError && (
          <div className="text-xs text-red-600 mt-1">{locationError}</div>
        )}
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

      {/* Incident Modal */}
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
