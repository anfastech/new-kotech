"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSocket } from "@/components/providers/socket-provider"
import { VehicleInfoPanel } from "./vehicle-info-panel"
import { IncidentReportModal } from "./incident-report-modal"
import { TrafficLegend } from "./traffic-legend"
import { TestCoordinate } from "./test-coordinate"
import { useNotifications } from "@/components/notifications/notification-provider"
import { useMap } from "@/components/providers/map-provider"
import { useRole } from "@/components/providers/role-provider"
interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "police" | "school_bus" | "city_bus" | "normal"
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
  const destinationMarkersRef = useRef<{ [key: string]: any }>({})
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isMapboxLoaded, setIsMapboxLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [incidentLocation, setIncidentLocation] = useState<[number, number] | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string>("kottakkal-center")
  const [showDestinationSelector, setShowDestinationSelector] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState({
    ambulance: true,
    fire: true,
    police: true,
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
  
  // Test coordinates integration
  const [testCoordinates, setTestCoordinates] = useState<{latitude: number, longitude: number} | null>(null)
  const testCoordinatesIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { socket, isConnected, connectionStatus } = useSocket()
  const { sendNotification } = useNotifications()
  const { currentRole } = useRole()
  const {
    setVehicles: setVehiclesContext,
    setVisibleLayers: setVisibleLayersContext,
    setUserLocation: setUserLocationContext,
    setIsTrackingUser: setIsTrackingUserContext,
    setAutoCenter: setAutoCenterContext,
    setShowRoutes: setShowRoutesContext,
    setMapFunctions
  } = useMap()

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

  // Location API integration
  const fetchLocationFromAPI = async () => {
    try {
      const response = await fetch('/api/location?clientId=test-coordinate-client')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.location) {
          const location = data.data.location
          const newUserLocation: UserLocation = {
            coordinates: location.coordinates,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          }
          setUserLocation(newUserLocation)
          updateUserLocationMarker(newUserLocation)
          console.log('Location fetched from API:', location)
        }
      }
    } catch (error) {
      console.error('Failed to fetch location from API:', error)
    }
  }

  // Fetch location from API every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchLocationFromAPI, 3000)
    return () => clearInterval(interval)
  }, [])

  // Memoize map functions to prevent infinite loops
  const memoizedOnLayerToggle = useCallback((layer: any, visible: boolean) => {
    setVisibleLayers(prev => ({ ...prev, [layer]: visible }))
  }, [])

  const memoizedOnToggleAutoCenter = useCallback((checked: boolean) => {
    setAutoCenter(checked)
  }, [])

  // Sync local state with context
  useEffect(() => {
    setVisibleLayersContext(visibleLayers)
  }, [visibleLayers, setVisibleLayersContext])

  useEffect(() => {
    setUserLocationContext(userLocation)
  }, [userLocation, setUserLocationContext])

  useEffect(() => {
    setIsTrackingUserContext(isTrackingUser)
  }, [isTrackingUser, setIsTrackingUserContext])

  useEffect(() => {
    setAutoCenterContext(autoCenter)
  }, [autoCenter, setAutoCenterContext])

  useEffect(() => {
    setShowRoutesContext(showRoutes)
  }, [showRoutes, setShowRoutesContext])

  // Test coordinates integration - listen for coordinates from test component
  useEffect(() => {
    const handleTestCoordinates = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail
      setTestCoordinates({ latitude, longitude })
      
      // Update user location with test coordinates
      const newUserLocation: UserLocation = {
        coordinates: [longitude, latitude],
        accuracy: 10, // Default accuracy for test coordinates
        timestamp: Date.now(),
      }
      setUserLocation(newUserLocation)
      updateUserLocationMarker(newUserLocation)
      
      console.log('Test coordinates received:', { latitude, longitude })
    }

    // Listen for custom event from test coordinates component
    window.addEventListener('test-coordinates-update', handleTestCoordinates as EventListener)
    
    return () => {
      window.removeEventListener('test-coordinates-update', handleTestCoordinates as EventListener)
    }
  }, [])

  // Listen for navigation events from GPS dialog
  useEffect(() => {
    const handleNavigateToDestination = (event: CustomEvent) => {
      const { destination, userLocation } = event.detail
      if (destination && userLocation) {
        calculateRouteFromUser(destination.coordinates)
      }
    }

    const handleNavigateBetweenPoints = (event: CustomEvent) => {
      const { from, to } = event.detail
      if (from && to) {
        navigateBetweenPoints(from.coordinates, to.coordinates)
      }
    }

    const handleClearRoute = () => {
      clearRoute()
    }

    window.addEventListener('navigate-to-destination', handleNavigateToDestination as EventListener)
    window.addEventListener('navigate-between-points', handleNavigateBetweenPoints as EventListener)
    window.addEventListener('clear-route', handleClearRoute as EventListener)

    return () => {
      window.removeEventListener('navigate-to-destination', handleNavigateToDestination as EventListener)
      window.removeEventListener('navigate-between-points', handleNavigateBetweenPoints as EventListener)
      window.removeEventListener('clear-route', handleClearRoute as EventListener)
    }
  }, [])

  // Geolocation permission and auto-start
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setLocationPermission(result.state as any)
          result.addEventListener("change", () => {
            setLocationPermission(result.state as any)
          })
          
          // Auto-start GPS tracking if permission is granted
          if (result.state === "granted" && !isTrackingUser) {
            setTimeout(() => {
              startLocationTracking()
            }, 2000) // Small delay to ensure map is loaded
          }
        })
        .catch(() => setLocationPermission("unknown"))
    } else {
      // Fallback for browsers without permissions API
      if (!isTrackingUser) {
        setTimeout(() => {
          startLocationTracking()
        }, 3000)
      }
    }
  }, [isTrackingUser])

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
                  [75.7680, 11.2370],  // Southwest (bottom-left)
                  [75.7920, 11.2370],  // Southeast (bottom-right)
                  [75.7920, 11.2730],  // Northeast (top-right)
                  [75.7680, 11.2730],  // Northwest (top-left)
                  [75.7680, 11.2370]   // Close the polygon
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
        
        // Add Kottakkal destination markers
        Object.entries(kottakkalDestinations).forEach(([key, destination]) => {
          const markerId = `destination-${key}`
          
          // Create marker element
          const el = document.createElement('div')
          el.className = 'destination-marker'
          el.innerHTML = `
            <div class="bg-white border-2 border-blue-500 rounded-full p-2 shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <div class="text-lg">${destination.icon}</div>
            </div>
          `
          
          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-semibold text-sm mb-2 text-blue-600">${destination.name}</h3>
              <div class="space-y-1 text-xs">
                <div><strong>Coordinates:</strong> ${destination.coordinates[1].toFixed(6)}, ${destination.coordinates[0].toFixed(6)}</div>
                <div class="mt-2 pt-2 border-t text-xs text-gray-600">
                  <div>📍 Kottakkal City Point</div>
                  <div>🗺️ Available for navigation</div>
                </div>
              </div>
            </div>
          `)
          
          // Add marker to map
          const marker = new mapboxgl.Marker(el)
            .setLngLat(destination.coordinates)
            .setPopup(popup)
            .addTo(map)
          
          // Store marker reference
          destinationMarkersRef.current[key] = marker
        })
        
        // Automatically show route from Custom Point to New Bus Stand
        setTimeout(() => {
          const from = kottakkalDestinations["custom-point"]
          const to = kottakkalDestinations["new-bus-stand"]
          
          if (from && to && mapInstanceRef.current) {
            // Get road-following route from navigation API
            fetch("/api/navigation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                origin: from.coordinates,
                destination: to.coordinates,
                vehicle_type: "normal",
                avoid_congestion: true,
              }),
            })
            .then(response => response.json())
            .then(data => {
              console.log("Auto route API response:", data)
              
              if (data.success && data.data.routes && data.data.routes.length > 0) {
                const route = data.data.routes[0]
                
                // Add route source
                mapInstanceRef.current.addSource("auto-route", {
                  type: "geojson",
                  data: {
                    type: "Feature",
                    properties: {
                      from: from.name,
                      to: to.name,
                      distance: route.distance,
                      duration: route.duration,
                    },
                    geometry: route.geometry,
                  },
                })
                
                // Add route outline (white background)
                mapInstanceRef.current.addLayer({
                  id: "auto-route-outline",
                  type: "line",
                  source: "auto-route",
                  layout: {
                    "line-join": "round",
                    "line-cap": "round"
                  },
                  paint: {
                    "line-color": "#ffffff",
                    "line-width": 12,
                    "line-opacity": 0.9
                  }
                })
                
                // Add main route line (green)
                mapInstanceRef.current.addLayer({
                  id: "auto-route",
                  type: "line",
                  source: "auto-route",
                  layout: {
                    "line-join": "round",
                    "line-cap": "round"
                  },
                  paint: {
                    "line-color": "#10b981",
                    "line-width": 8,
                    "line-opacity": 1.0
                  }
                })
                
                // Fit map to show the route
                const coordinates = route.geometry.coordinates as [number, number][]
                if (coordinates.length > 0) {
                  const bounds = coordinates.reduce(
                    (bounds: any, coord: [number, number]) => {
                      return bounds.extend(coord)
                    },
                    new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
                  )
                  mapInstanceRef.current.fitBounds(bounds, { 
                    padding: 150, 
                    duration: 2000,
                    maxZoom: 14
                  })
                }
                
                // Success notification
                const distanceKm = (route.distance / 1000).toFixed(1)
                const durationMin = Math.round(route.duration / 60)
                
                sendNotification(
                  "Road Route Displayed", 
                  `${from.name} → ${to.name}: ${distanceKm}km, ${durationMin}min (via roads)`
                )

                console.log("Road route created:", {
                  from: from.name,
                  to: to.name,
                  distance: distanceKm + "km",
                  duration: durationMin + "min",
                  coordinates: coordinates.length,
                  roadFollowing: true
                })
                
                console.log("Road route created:", {
                  from: from.name,
                  to: to.name,
                  distance: distanceKm + "km",
                  duration: durationMin + "min",
                  coordinates: coordinates.length
                })
                
              } else {
                console.error("No route found, creating fallback straight line")
                // Fallback to straight line if API fails
                createStraightLineRoute(from, to)
              }
            })
            .catch(error => {
              console.error("Route API error, creating fallback:", error)
              // Fallback to straight line if API fails
              createStraightLineRoute(from, to)
            })
          }
        }, 3000) // 3 second delay to ensure map is fully loaded
        
        // Fallback function for straight line route
        const createStraightLineRoute = (from: any, to: any) => {
          try {
            // Calculate distance using Haversine formula
            const R = 6371000 // Earth's radius in meters
            const lat1 = from.coordinates[1] * Math.PI / 180
            const lat2 = to.coordinates[1] * Math.PI / 180
            const deltaLat = (to.coordinates[1] - from.coordinates[1]) * Math.PI / 180
            const deltaLng = (to.coordinates[0] - from.coordinates[0]) * Math.PI / 180
            
            const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                      Math.cos(lat1) * Math.cos(lat2) *
                      Math.sin(deltaLng/2) * Math.sin(deltaLng/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distance = R * c
            
            // Create route data
            const routeData = {
              type: "Feature",
              properties: {
                from: from.name,
                to: to.name,
                distance: distance,
                duration: Math.round(distance / 8.33)
              },
              geometry: {
                type: "LineString",
                coordinates: [from.coordinates, to.coordinates]
              }
            }
            
            // Add route source
            mapInstanceRef.current.addSource("auto-route", {
              type: "geojson",
              data: routeData
            })
            
            // Add route outline (white background)
            mapInstanceRef.current.addLayer({
              id: "auto-route-outline",
              type: "line",
              source: "auto-route",
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": "#ffffff",
                "line-width": 12,
                "line-opacity": 0.9
              }
            })
            
            // Add main route line (green)
            mapInstanceRef.current.addLayer({
              id: "auto-route",
              type: "line",
              source: "auto-route",
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": "#10b981",
                "line-width": 8,
                "line-opacity": 1.0
              }
            })
            
            // Fit map to show both points and route
            const bounds = new (window as any).mapboxgl.LngLatBounds()
            bounds.extend(from.coordinates)
            bounds.extend(to.coordinates)
            mapInstanceRef.current.fitBounds(bounds, { 
              padding: 150, 
              duration: 2000,
              maxZoom: 14
            })
            
            // Success notification
            const distanceKm = (distance / 1000).toFixed(1)
            const durationMin = Math.round(distance / 1000 * 2)
            
            sendNotification(
              "Direct Route Displayed", 
              `${from.name} → ${to.name}: ${distanceKm}km, ~${durationMin}min (direct line)`
            )
            
            console.log("Fallback route created:", {
              from: from.name,
              to: to.name,
              distance: distanceKm + "km",
              duration: durationMin + "min"
            })
            
          } catch (error) {
            console.error("Fallback route creation error:", error)
          }
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

      // Add click handler for navigation hints
      map.on("click", (e: any) => {
        const lngLat = e.lngLat
        if (userLocation) {
          // Show navigation hint when clicking on map
          const distance = Math.sqrt(
            Math.pow(lngLat.lng - userLocation.coordinates[0], 2) +
            Math.pow(lngLat.lat - userLocation.coordinates[1], 2)
          )
          
          if (distance > 0.001) { // Only show for clicks away from current location
            sendNotification(
              "Navigation Hint", 
              `Use the navigation buttons to get directions from your current location (${userLocation.coordinates[1].toFixed(4)}, ${userLocation.coordinates[0].toFixed(4)})`
            )
          }
        } else {
          sendNotification(
            "Location Required", 
            "Set your location first to enable navigation features"
          )
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
    
    const options = { 
      enableHighAccuracy: true, 
      timeout: 15000, 
      maximumAge: 3000 
    }
    
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
      
      // Auto-center on first location fix
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo({ 
          center: newLoc.coordinates, 
          zoom: 16, 
          duration: 1000 
        })
      }
      
      // Auto-calculate route to selected destination when location is obtained
      if (newLoc.coordinates && isWithinMalappuramBounds(newLoc.coordinates)) {
        setTimeout(() => {
          const selectedDest = kottakkalDestinations[selectedDestination as keyof typeof kottakkalDestinations]
          if (selectedDest) {
            calculateRouteFromUser(selectedDest.coordinates as [number, number], "normal")
            sendNotification(
              "Route Calculated", 
              `Auto-routing to ${selectedDest.name} from your location`
            )
          }
        }, 1000) // Small delay to ensure marker is placed first
      }
      
      if (socket) socket.emit("user-location-update", { userId: "current-user", location: newLoc })
      
      sendNotification(
        "GPS Active", 
        `Location: ${newLoc.coordinates[1].toFixed(4)}, ${newLoc.coordinates[0].toFixed(4)} | Accuracy: ±${Math.round(newLoc.accuracy)}m`
      )
    }
    
    const error = (error: GeolocationPositionError) => {
      let msg = "Unknown error"
      switch (error.code) {
        case error.PERMISSION_DENIED: 
          msg = "Location access denied by user"; 
          setLocationPermission("denied"); 
          break
        case error.POSITION_UNAVAILABLE: 
          msg = "Location unavailable"; 
          break
        case error.TIMEOUT: 
          msg = "Location request timed out"; 
          break
      }
      setLocationError(msg)
      setIsTrackingUser(false)
      sendNotification("Location Error", msg)
    }
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(success, error, options)
    
    // Start continuous tracking
    const watchId = navigator.geolocation.watchPosition(success, error, options)
    userLocationWatchRef.current = watchId
    setIsTrackingUser(true)
    
    sendNotification("GPS Tracking", "Starting real-time location tracking...")
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
        <h3 class="font-semibold text-sm mb-2 text-blue-600">🎯 Navigation Start Point</h3>
        <div class="space-y-1 text-xs">
          <div><strong>Coordinates:</strong> ${location.coordinates[1].toFixed(6)}, ${location.coordinates[0].toFixed(6)}</div>
          <div><strong>Accuracy:</strong> ±${Math.round(location.accuracy)}m</div>
          ${location.speed ? `<div><strong>Speed:</strong> ${Math.round(location.speed * 3.6)} km/h</div>` : ""}
          ${location.heading ? `<div><strong>Heading:</strong> ${Math.round(location.heading)}°</div>` : ""}
          <div><strong>Updated:</strong> ${new Date(location.timestamp).toLocaleTimeString()}</div>
        </div>
        <div class="mt-2 pt-2 border-t text-xs text-gray-600">
          <div>✅ Within Malappuram District</div>
          <div>🛣️ Ready for navigation</div>
          <div>🎯 Use navigation buttons to get directions</div>
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

  // Set user location manually to the provided coordinates
  const setUserLocationManually = () => {
    const manualLocation: UserLocation = {
      coordinates: [75.8252, 11.2329], // Your provided coordinates
      accuracy: 59687,
      timestamp: Date.now(),
    }
    setUserLocation(manualLocation)
    setLocationError(null)
    sendNotification("Location Set", "Your location has been set to the provided coordinates")
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
    const handleVehiclesData = (vehiclesData: Vehicle[]) => {
      setVehicles(vehiclesData)
      setVehiclesContext(vehiclesData)
    }
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
  }, [socket, sendNotification, setVehiclesContext])

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

  // Kottakkal city destinations
  const kottakkalDestinations = {
    "kottakkal-center": { name: "Kottakkal Center", coordinates: [75.7804, 11.2588], icon: "🏙️" },
    "kottakkal-hospital": { name: "Kottakkal Hospital", coordinates: [75.7804, 11.2588], icon: "🏥" },
    "kottakkal-bus-stand": { name: "Kottakkal Bus Stand", coordinates: [75.7824, 11.2608], icon: "🚌" },
    "new-bus-stand": { name: "New Bus Stand", coordinates: [76.0047806, 11.0017263], icon: "🚌" },
    "kottakkal-railway": { name: "Kottakkal Railway Station", coordinates: [75.7844, 11.2628], icon: "🚂" },
    "kottakkal-market": { name: "Kottakkal Market", coordinates: [75.7814, 11.2598], icon: "🛒" },
    "kottakkal-college": { name: "Kottakkal College", coordinates: [75.7834, 11.2618], icon: "🎓" },
    "kottakkal-temple": { name: "Kottakkal Temple", coordinates: [75.7854, 11.2638], icon: "🕍" },
    "kottakkal-park": { name: "Kottakkal Park", coordinates: [75.7864, 11.2648], icon: "🌳" },
    "custom-point": { name: "Custom Point", coordinates: [75.994819, 11.006126], icon: "📍" },
    // Update ambulance destination to Almas Hospital
    "ambulance-destination": { name: "Almas Hospital", coordinates: [75.990876, 10.9999541], icon: "🏥" },
    "ambulance-from": { name: "Co-operative Hospital", coordinates: [76.0043999, 11.0032025], icon: "🚑" },
  }

  // Default destination for non-ambulance
  const kottakkalDest: [number, number] = [75.7804, 11.2588]
  // Default destination for ambulance driver
  const ambulanceDest: [number, number] = [75.990876, 10.9999541] // Almas Hospital

  const calculateRoute = async (vehicle: Vehicle, destination?: [number, number]) => {
    if (!mapInstanceRef.current) return
    const endPoint = destination || (vehicle.type === "ambulance" ? ambulanceDest : kottakkalDest)
    try {
      const response = await fetch("/api/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: vehicle.coordinates,
          destination: endPoint,
          vehicle_type: vehicle.type,
          avoid_congestion: true,
        }),
      })
      const data = await response.json()
      if (data.success && data.data.routes && data.data.routes.length > 0) {
        const route = data.data.routes[0]
        
        // Remove existing route if it exists
        if (routesRef.current[vehicle.id]) {
          mapInstanceRef.current.removeLayer(`route-${vehicle.id}`)
          mapInstanceRef.current.removeSource(`route-${vehicle.id}`)
        }
        
        // Add new route source
        mapInstanceRef.current.addSource(`route-${vehicle.id}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              vehicle_type: vehicle.type,
              distance: route.distance,
              duration: route.duration,
            },
            geometry: route.geometry,
          },
        })
        
        // Determine route color based on vehicle type
        const routeColor = vehicle.type === "ambulance" ? "#ef4444" : 
                          vehicle.type === "fire" ? "#f97316" : 
                          vehicle.type === "police" ? "#8b5cf6" : "#3b82f6"
        
        // Add route layer with enhanced styling
        mapInstanceRef.current.addLayer({
          id: `route-${vehicle.id}`,
          type: "line",
          source: `route-${vehicle.id}`,
          layout: { 
            "line-join": "round", 
            "line-cap": "round" 
          },
          paint: {
            "line-color": routeColor,
            "line-width": 6,
            "line-opacity": 0.9,
          },
        })
        
        // Add route outline for better visibility
        mapInstanceRef.current.addLayer({
          id: `route-${vehicle.id}-outline`,
          type: "line",
          source: `route-${vehicle.id}`,
          layout: { 
            "line-join": "round", 
            "line-cap": "round" 
          },
          paint: {
            "line-color": "#ffffff",
            "line-width": 8,
            "line-opacity": 0.3,
          },
        }, `route-${vehicle.id}`)
        
        // Store route reference
        routesRef.current[vehicle.id] = {
          source: `route-${vehicle.id}`,
          layer: `route-${vehicle.id}`,
          outlineLayer: `route-${vehicle.id}-outline`,
          data: route,
        }
        
        setVehicleRoutes((prev) => ({
          ...prev,
          [vehicle.id]: route,
        }))
        
        // Fit map to route bounds
        const coordinates = route.geometry.coordinates
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => bounds.extend(coord),
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: 50, duration: 1000 })
        }
        
        // Show route information
        sendNotification(
          "Route Calculated", 
          `${vehicle.type} route: ${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)}min`
        )
      }
    } catch (error) {
      console.error("Route calculation error:", error)
      sendNotification("Route Error", "Failed to calculate route for vehicle")
    }
  }

  // Update calculateRouteFromUser to use red route for ambulance-driver
  const calculateRouteFromUser = async (destination: [number, number], vehicleType = "normal") => {
    if (!userLocation || !mapInstanceRef.current) {
      sendNotification("Route Error", "Your location is required for routing")
      return null
    }
    try {
      const response = await fetch("/api/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: userLocation.coordinates,
          destination: destination,
          vehicle_type: vehicleType,
          avoid_congestion: true,
        }),
      })
      const data = await response.json()
      if (data.success && data.data.routes && data.data.routes.length > 0) {
        const route = data.data.routes[0]
        const routeId = `user-route-${Date.now()}`
        
        // Remove existing user route if it exists
        if (mapInstanceRef.current.getLayer(routeId)) {
          mapInstanceRef.current.removeLayer(routeId)
          mapInstanceRef.current.removeSource(routeId)
        }
        
        mapInstanceRef.current.addSource(routeId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              user_route: true,
              distance: route.distance,
              duration: route.duration,
            },
            geometry: route.geometry,
          },
        })
        
        // Set route color based on specific conditions:
        // - Red for ambulance routes (vehicleType === "ambulance")
        // - Green for normal routes to bus stand or other destinations
        let mainColor = "#10b981" // Default green
        if (vehicleType === "ambulance") {
          mainColor = "#ef4444" // Red for ambulance
        } else if (currentRole === "ambulance-driver" && vehicleType === "normal") {
          // If ambulance driver is doing normal routing, still use green
          mainColor = "#10b981"
        }
        
        const outlineColor = "#ffffff"
        
        // Add user route with dashed line style
        mapInstanceRef.current.addLayer({
          id: routeId,
          type: "line",
          source: routeId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": mainColor,
            "line-width": 6,
            "line-opacity": 0.9,
            "line-dasharray": [2, 2],
          },
        })
        
        // Add outline for better visibility
        mapInstanceRef.current.addLayer({
          id: `${routeId}-outline`,
          type: "line",
          source: routeId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": outlineColor,
            "line-width": 8,
            "line-opacity": 0.3,
            "line-dasharray": [2, 2],
          },
        }, routeId)
        
        const coordinates = route.geometry.coordinates
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => bounds.extend(coord),
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: 50, duration: 1000 })
        }
        
        sendNotification(
          "Navigation", 
          `Route to destination: ${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)}min`
        )
        
        return route
      }
    } catch (error) {
      console.error("User route calculation error:", error)
      sendNotification("Route Error", "Failed to calculate route from your location")
      return null
    }
  }

  const toggleRoutes = () => {
    if (showRoutes) {
      // Remove all route layers and sources
      Object.keys(routesRef.current).forEach((vehicleId) => {
        if (mapInstanceRef.current) {
          const routeRef = routesRef.current[vehicleId]
          if (routeRef.outlineLayer) {
            mapInstanceRef.current.removeLayer(routeRef.outlineLayer)
          }
          mapInstanceRef.current.removeLayer(routeRef.layer)
          mapInstanceRef.current.removeSource(routeRef.source)
        }
      })
      routesRef.current = {}
      setVehicleRoutes({})
    } else {
      // Show routes for emergency vehicles
      vehicles
        .filter((v) => v.type === "ambulance" || v.type === "fire" || v.type === "police")
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
        center: userLocation ? userLocation.coordinates : [75.9988, 11.0001], // Use API location if available, else default
        zoom: 14,
        duration: 1000,
      })
    }
  }

  const clearRoute = () => {
    if (mapInstanceRef.current && routesRef.current["city-route"]) {
      try {
        mapInstanceRef.current.removeLayer("route-city-route-outline")
        mapInstanceRef.current.removeLayer("route-city-route")
        mapInstanceRef.current.removeSource("route-city-route")
        delete routesRef.current["city-route"]
        sendNotification("Route Cleared", "Route has been removed from the map")
      } catch (error) {
        console.log("Clearing route...")
      }
    }
  }

  const navigateToDestination = (destinationKey: string) => {
    const destination = kottakkalDestinations[destinationKey as keyof typeof kottakkalDestinations]
    if (!destination) return
    
    setSelectedDestination(destinationKey)
    setShowDestinationSelector(false)
    
    if (userLocation) {
      calculateRouteFromUser(destination.coordinates as [number, number], "normal")
      sendNotification(
        "Navigation Started", 
        `Routing to ${destination.name} from your current location`
      )
    } else {
      sendNotification(
        "Location Required", 
        "Please enable GPS tracking to start navigation"
      )
    }
  }

  const navigateBetweenPoints = (fromKey: string, toKey: string) => {
    const from = kottakkalDestinations[fromKey as keyof typeof kottakkalDestinations]
    const to = kottakkalDestinations[toKey as keyof typeof kottakkalDestinations]
    
    if (!from || !to) {
      sendNotification("Route Error", "Invalid destination points")
      return
    }
    
    if (!mapInstanceRef.current) {
      sendNotification("Map Error", "Map not loaded")
      return
    }
    
    sendNotification("Creating Road Route", `Calculating road-following route from ${from.name} to ${to.name}...`)
    
    // Use the navigation API for road-following routing
    fetch("/api/navigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: from.coordinates,
        destination: to.coordinates,
        vehicle_type: "normal",
        avoid_congestion: true,
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log("Road route API response:", data)
      
      if (data.success && data.data.routes && data.data.routes.length > 0) {
        const route = data.data.routes[0]
        
        // Remove existing route if it exists
        if (routesRef.current["city-route"]) {
          try {
            mapInstanceRef.current.removeLayer("route-city-route-outline")
            mapInstanceRef.current.removeLayer("route-city-route")
            mapInstanceRef.current.removeSource("route-city-route")
          } catch (e) {
            console.log("Removing old route layers...")
          }
        }
        
        // Add route source
        mapInstanceRef.current.addSource("route-city-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {
              from: from.name,
              to: to.name,
              distance: route.distance,
              duration: route.duration,
            },
            geometry: route.geometry,
          },
        })
        
        // Add route outline (white background)
        mapInstanceRef.current.addLayer({
          id: "route-city-route-outline",
          type: "line",
          source: "route-city-route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#ffffff",
            "line-width": 12,
            "line-opacity": 0.9
          }
        })
        
        // Add main route line (green)
        mapInstanceRef.current.addLayer({
          id: "route-city-route",
          type: "line",
          source: "route-city-route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#10b981",
            "line-width": 8,
            "line-opacity": 1.0
          }
        })
        
        // Store route reference
        routesRef.current["city-route"] = {
          source: "route-city-route",
          layer: "route-city-route",
          outlineLayer: "route-city-route-outline",
          data: route
        }
        
        // Fit map to show the route
        const coordinates = route.geometry.coordinates as [number, number][]
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => {
              return bounds.extend(coord)
            },
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
          )
          mapInstanceRef.current.fitBounds(bounds, {
            padding: 100,
            duration: 2000,
            maxZoom: 15
          })
        }
        
        // Success notification
        const distanceKm = (route.distance / 1000).toFixed(1)
        const durationMin = Math.round(route.duration / 60)
        
        sendNotification(
          "Road Route Created",
          `${from.name} → ${to.name}: ${distanceKm}km, ${durationMin}min (via roads)`
        )
        
        console.log("Road route created successfully:", {
          from: from.name,
          to: to.name,
          distance: distanceKm + "km",
          duration: durationMin + "min",
          coordinates: coordinates.length,
          roadFollowing: true
        })
        
      } else {
        console.error("No route found in API response")
        sendNotification("Route Error", "Could not calculate road route")
      }
    })
    .catch(error => {
      console.error("Route API error:", error)
      sendNotification("Route Error", "Failed to calculate road route")
    })
  }

  // Add this function to draw ambulance route between two fixed points
  const drawAmbulanceRoute = async () => {
    const from = kottakkalDestinations["ambulance-from"].coordinates as [number, number]
    const to = kottakkalDestinations["ambulance-destination"].coordinates as [number, number]
    if (!mapInstanceRef.current || !isMapLoaded) {
      sendNotification("Map Error", "Map is not loaded yet.")
      return
    }
    try {
      const response = await fetch("/api/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: from,
          destination: to,
          vehicle_type: "ambulance",
          avoid_congestion: true,
        }),
      })
      const data = await response.json()
      if (data.success && data.data.routes && data.data.routes.length > 0) {
        const route = data.data.routes[0]
        // Remove previous ambulance route if exists (catch errors)
        try {
          if (mapInstanceRef.current.getLayer("ambulance-fixed-route")) {
            mapInstanceRef.current.removeLayer("ambulance-fixed-route")
          }
        } catch (e) { console.warn("No previous ambulance-fixed-route layer to remove") }
        try {
          if (mapInstanceRef.current.getSource("ambulance-fixed-route")) {
            mapInstanceRef.current.removeSource("ambulance-fixed-route")
          }
        } catch (e) { console.warn("No previous ambulance-fixed-route source to remove") }
        // Add new source
        mapInstanceRef.current.addSource("ambulance-fixed-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          },
        })
        // Try to add above a known layer, fallback to default
        let beforeLayerId = undefined
        const layers = mapInstanceRef.current.getStyle().layers
        if (layers) {
          // Try to add above the first symbol or marker layer
          const found = layers.find((l: any) => l.id.includes("marker") || l.type === "symbol")
          if (found) beforeLayerId = found.id
        }
        try {
          mapInstanceRef.current.addLayer({
            id: "ambulance-fixed-route",
            type: "line",
            source: "ambulance-fixed-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#ef4444",
              "line-width": 8,
              "line-opacity": 1.0,
            },
          }, beforeLayerId)
        } catch (e) {
          console.error("Error adding ambulance-fixed-route layer:", e)
          sendNotification("Map Error", "Could not add ambulance route layer.")
          return
        }
        // Fit map to show the route
        const coordinates = route.geometry.coordinates as [number, number][]
        if (coordinates.length > 0) {
          const bounds = coordinates.reduce(
            (bounds: any, coord: [number, number]) => bounds.extend(coord),
            new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
          )
          mapInstanceRef.current.fitBounds(bounds, { padding: 100, duration: 1500, maxZoom: 15 })
        }
        sendNotification(
          "Ambulance Route",
          `Co-operative Hospital → Almas Hospital: ${(route.distance / 1000).toFixed(1)}km, ${Math.round(route.duration / 60)}min (red route)`
        )
      } else {
        sendNotification("Route Error", "No route found for ambulance.")
      }
    } catch (error) {
      console.error("Ambulance route error:", error)
      sendNotification("Route Error", "Failed to draw ambulance route")
    }
  }

  // Set map functions in context after all functions are defined
  useEffect(() => {
    setMapFunctions({
      onLayerToggle: memoizedOnLayerToggle,
      onStartTracking: startLocationTracking,
      onStopTracking: stopLocationTracking,
      onCenterOnUser: centerOnUser,
      onToggleAutoCenter: memoizedOnToggleAutoCenter,
      onToggleRoutes: toggleRoutes,
      onResetView: resetMapView,
    })
  }, [setMapFunctions, memoizedOnLayerToggle, memoizedOnToggleAutoCenter, startLocationTracking, stopLocationTracking, centerOnUser, toggleRoutes, resetMapView])

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
      <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-3">
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
        {/* Role-based Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {currentRole === "ambulance-driver" ? "🚑 Driver Controls" : "📍 Location Tracking"}
          </span>
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
              {/* --- Navigation Options --- */}
              <button
                onClick={() => calculateRouteFromUser(kottakkalDest)}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Navigate to Kottakkal
              </button>
              <button
                onClick={() => calculateRouteFromUser(kottakkalDestinations["kottakkal-bus-stand"].coordinates as [number, number], "normal")}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                🚌 Navigate to Bus Stand
              </button>
              {/* Ambulance route button available to all users */}
              <button
                onClick={drawAmbulanceRoute}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                🚑 Ambulance: Co-operative → Almas (Red Route)
              </button>
              <button
                onClick={() => calculateRouteFromUser([75.7804, 11.2588])}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Navigate to Hospital
              </button>
              
              {/* Driver-specific buttons */}
              {currentRole === "ambulance-driver" && (
                <>
                  <button
                    onClick={() => calculateRouteFromUser(ambulanceDest, "ambulance")}
                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    🚑 Emergency Route to Almas Hospital
                  </button>
                  <button
                    onClick={() => sendNotification("Emergency Mode", "Emergency vehicle routing activated")}
                    className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🚨 Emergency Mode
                  </button>
                </>
              )}
            </>
          )}
          {!userLocation && (
            <button
              onClick={setUserLocationManually}
              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Set My Location
            </button>
          )}
        </div>
      </div>

      {/* Malappuram District Indicator */}
      <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium text-blue-800">Malappuram District</span>
        </div>
        <div className="text-xs text-blue-600 mt-1">View restricted to district boundaries</div>
      </div>

      {/* Driver Status Indicator */}
      {currentRole === "ambulance-driver" && (
        <div className="absolute top-4 left-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-medium text-red-800">Emergency Driver</span>
          </div>
          <div className="text-xs text-red-600 mt-1">Priority routing & emergency features active</div>
        </div>
      )}

      {/* Destination Selector Modal */}
      {showDestinationSelector && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🗺️ Kottakkal Navigation</h3>
              <button
                onClick={() => setShowDestinationSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Navigate from your location to:</h4>
                {!userLocation ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-800 font-medium mb-1">📍 GPS Required</div>
                    <div className="text-xs text-yellow-600 mb-3">Please enable GPS tracking first to start navigation</div>
                    <button
                      onClick={() => {
                        setShowDestinationSelector(false)
                        startLocationTracking()
                      }}
                      className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      🎯 Enable GPS Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(kottakkalDestinations).map(([key, destination]) => (
                      <button
                        key={key}
                        onClick={() => navigateToDestination(key)}
                        className="flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <span className="text-xl">{destination.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{destination.name}</div>
                          <div className="text-xs text-gray-500">
                            {destination.coordinates[1].toFixed(4)}, {destination.coordinates[0].toFixed(4)}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">→ Navigate</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Navigate between city points:</h4>
                
                {/* Quick Route: Custom Point to Bus Stand */}
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs font-medium text-blue-800 mb-2">🚀 Quick Route:</div>
                  <button
                    onClick={() => navigateBetweenPoints("custom-point", "new-bus-stand")}
                    className="flex items-center space-x-2 p-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
                  >
                    <span>📍</span>
                    <span>Custom Point</span>
                    <span>→</span>
                    <span>🚌</span>
                    <span>New Bus Stand</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(kottakkalDestinations).slice(0, 4).map(([fromKey, fromDest]) => (
                    <div key={fromKey} className="space-y-1">
                      <div className="text-xs font-medium text-gray-600">From {fromDest.name}:</div>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(kottakkalDestinations)
                          .filter(([toKey]) => toKey !== fromKey)
                          .slice(0, 4)
                          .map(([toKey, toDest]) => (
                            <button
                              key={toKey}
                              onClick={() => navigateBetweenPoints(fromKey, toKey)}
                              className="flex items-center space-x-1 p-2 text-xs border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                            >
                              <span>{toDest.icon}</span>
                              <span className="truncate">{toDest.name}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls - Now available in Settings Modal */}

      {/* Traffic Legend */}
      <TrafficLegend showRoutes={showRoutes} />

      {/* Vehicle Info Panel */}
      {selectedVehicle && (
        <VehicleInfoPanel
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          routeData={vehicleRoutes[selectedVehicle.id]}
          onShowRoute={() => selectedVehicle && selectedVehicle.type === "ambulance" && calculateRoute(selectedVehicle)}
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

      {/* Test Coordinate Component */}
      <TestCoordinate />
    </div>
  )
}
