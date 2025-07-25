"use client"

import { useEffect, useRef, useState } from "react"
import { useSocket } from "@/components/providers/socket-provider"
import { MapControls } from "./map-controls"
import { IncidentReportModal } from "./incident-report-modal"
import { VehicleInfoPanel } from "./vehicle-info-panel"
import { TrafficLegend } from "./traffic-legend"

// Declare mapboxgl as global
declare global {
  interface Window {
    mapboxgl: any
  }
}

// Kottakkal coordinates
const KOTTAKKAL_CENTER: [number, number] = [75.9064, 10.9847]

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  route?: [number, number][]
}

interface Incident {
  id: string
  type: "accident" | "congestion" | "roadblock" | "construction"
  coordinates: [number, number]
  description: string
  votes: number
  timestamp: Date
}

export function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const {
    database,
    isConnected,
    publishVehicleUpdate,
    publishIncidentUpdate,
    subscribeToVehicleUpdates,
    subscribeToIncidentUpdates,
    subscribeToTrafficUpdates,
  } = useSocket()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [reportLocation, setReportLocation] = useState<[number, number] | null>(null)
  const [activeLayer, setActiveLayer] = useState<string>("all")

  // Load Mapbox GL JS and CSS from CDN
  useEffect(() => {
    if (typeof window !== "undefined" && !window.mapboxgl) {
      // Load CSS
      const link = document.createElement("link")
      link.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
      link.rel = "stylesheet"
      document.head.appendChild(link)

      // Load JavaScript
      const script = document.createElement("script")
      script.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
      script.onload = () => {
        setMapLoaded(true)
        initializeMap()
      }
      script.onerror = () => {
        setMapError("Failed to load Mapbox GL JS")
      }
      document.head.appendChild(script)

      return () => {
        if (document.head.contains(link)) document.head.removeChild(link)
        if (document.head.contains(script)) document.head.removeChild(script)
      }
    } else if (window.mapboxgl) {
      setMapLoaded(true)
      initializeMap()
    }
  }, [])

  const initializeMap = () => {
    if (!mapContainer.current || !window.mapboxgl) return

    try {
      window.mapboxgl.accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test"

      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: KOTTAKKAL_CENTER,
        zoom: 13,
        pitch: 45,
        bearing: 0,
      })

      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl(), "top-right")
      map.current.addControl(
        new window.mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        "top-right",
      )

      // Initialize map layers
      map.current.on("load", () => {
        initializeMapLayers()
        loadMockData()
      })

      // Handle right-click for incident reporting
      map.current.on("contextmenu", (e) => {
        setReportLocation([e.lngLat.lng, e.lngLat.lat])
        setShowIncidentModal(true)
      })
    } catch (error) {
      setMapError("Failed to initialize map: " + error)
    }
  }

  // Firebase event listeners
  useEffect(() => {
    if (!database || !isConnected) return

    // Subscribe to vehicle updates
    const unsubscribeVehicles = subscribeToVehicleUpdates((vehicleData: Vehicle) => {
      setVehicles((prev) => {
        const updated = prev.filter((v) => v.id !== vehicleData.id)
        return [...updated, vehicleData]
      })
      updateVehicleOnMap(vehicleData)
    })

    // Subscribe to incident updates
    const unsubscribeIncidents = subscribeToIncidentUpdates((incidentData: Incident) => {
      setIncidents((prev) => {
        const updated = prev.filter((i) => i.id !== incidentData.id)
        return [...updated, incidentData]
      })
      updateIncidentOnMap(incidentData)
    })

    // Subscribe to traffic updates
    const unsubscribeTraffic = subscribeToTrafficUpdates((trafficData: any) => {
      updateTrafficLayer(trafficData)
    })

    return () => {
      unsubscribeVehicles()
      unsubscribeIncidents()
      unsubscribeTraffic()
    }
  }, [database, isConnected])

  const initializeMapLayers = () => {
    if (!map.current) return

    // Add vehicle sources and layers
    const vehicleTypes = ["ambulance", "fire", "school_bus", "city_bus", "normal"]

    vehicleTypes.forEach((type) => {
      // Add source
      map.current!.addSource(`${type}-vehicles`, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      })

      // Add layer with custom markers
      map.current!.addLayer({
        id: `${type}-vehicles-layer`,
        type: "circle",
        source: `${type}-vehicles`,
        paint: {
          "circle-radius": type === "ambulance" || type === "fire" ? 8 : 6,
          "circle-color": getVehicleColor(type),
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      })

      // Add click handler
      map.current!.on("click", `${type}-vehicles-layer`, (e) => {
        if (e.features && e.features[0]) {
          const feature = e.features[0]
          const vehicle = vehicles.find((v) => v.id === feature.properties?.id)
          if (vehicle) {
            setSelectedVehicle(vehicle)
          }
        }
      })
    })

    // Add incidents layer
    map.current!.addSource("incidents", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    })

    map.current!.addLayer({
      id: "incidents-layer",
      type: "circle",
      source: "incidents",
      paint: {
        "circle-radius": 10,
        "circle-color": "#ff4444",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    })

    // Add traffic congestion layer
    map.current!.addSource("traffic-congestion", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    })

    map.current!.addLayer({
      id: "traffic-congestion-layer",
      type: "fill",
      source: "traffic-congestion",
      paint: {
        "fill-color": ["interpolate", ["linear"], ["get", "congestion"], 0, "#00ff00", 0.5, "#ffff00", 1, "#ff0000"],
        "fill-opacity": 0.6,
      },
    })
  }

  const getVehicleColor = (type: string): string => {
    const colors = {
      ambulance: "#ff0000",
      fire: "#ff4400",
      school_bus: "#ffaa00",
      city_bus: "#0088ff",
      normal: "#00aa00",
    }
    return colors[type as keyof typeof colors] || "#666666"
  }

  const updateVehicleOnMap = (vehicle: Vehicle) => {
    if (!map.current) return

    const source = map.current.getSource(`${vehicle.type}-vehicles`) as any
    if (source) {
      const currentData = source._data as any
      const features = currentData.features.filter((f: any) => f.properties.id !== vehicle.id)

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: vehicle.coordinates,
        },
        properties: {
          id: vehicle.id,
          type: vehicle.type,
          status: vehicle.status,
        },
      })

      source.setData({
        type: "FeatureCollection",
        features,
      })
    }
  }

  const updateIncidentOnMap = (incident: Incident) => {
    if (!map.current) return

    const source = map.current.getSource("incidents") as any
    if (source) {
      const currentData = source._data as any
      const features = currentData.features.filter((f: any) => f.properties.id !== incident.id)

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: incident.coordinates,
        },
        properties: {
          id: incident.id,
          type: incident.type,
          description: incident.description,
          votes: incident.votes,
        },
      })

      source.setData({
        type: "FeatureCollection",
        features,
      })
    }
  }

  const updateTrafficLayer = (trafficData: any) => {
    if (!map.current) return

    const source = map.current.getSource("traffic-congestion") as any
    if (source) {
      source.setData(trafficData)
    }
  }

  const loadMockData = () => {
    // Mock vehicles data
    const mockVehicles: Vehicle[] = [
      {
        id: "amb-001",
        type: "ambulance",
        coordinates: [75.9064, 10.9847],
        status: "emergency",
        route: [
          [75.9064, 10.9847],
          [75.91, 10.988],
        ],
      },
      {
        id: "fire-001",
        type: "fire",
        coordinates: [75.908, 10.986],
        status: "responding",
      },
      {
        id: "bus-001",
        type: "school_bus",
        coordinates: [75.905, 10.983],
        status: "route",
      },
    ]

    // Publish initial vehicle data to Firebase
    mockVehicles.forEach((vehicle) => {
      if (publishVehicleUpdate) {
        publishVehicleUpdate(vehicle)
      }
      updateVehicleOnMap(vehicle)
    })
    setVehicles(mockVehicles)

    // Simulate real-time updates
    setInterval(() => {
      mockVehicles.forEach((vehicle) => {
        // Simulate movement
        vehicle.coordinates[0] += (Math.random() - 0.5) * 0.001
        vehicle.coordinates[1] += (Math.random() - 0.5) * 0.001

        // Publish to Firebase
        if (publishVehicleUpdate) {
          publishVehicleUpdate(vehicle)
        }
        updateVehicleOnMap(vehicle)
      })
    }, 3000)
  }

  const toggleLayer = (layerType: string) => {
    if (!map.current) return

    const visibility = map.current.getLayoutProperty(`${layerType}-vehicles-layer`, "visibility")
    map.current.setLayoutProperty(
      `${layerType}-vehicles-layer`,
      "visibility",
      visibility === "visible" ? "none" : "visible",
    )
  }

  const handleIncidentReport = (incidentData: any) => {
    if (database && reportLocation) {
      const incident: Incident = {
        id: `incident-${Date.now()}`,
        type: incidentData.type,
        coordinates: reportLocation,
        description: incidentData.description,
        votes: 0,
        timestamp: new Date(),
      }

      if (publishIncidentUpdate) {
        publishIncidentUpdate(incident)
      }
      setShowIncidentModal(false)
      setReportLocation(null)
    }
  }

  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-4">Map Loading Error</div>
          <div className="text-gray-600">{mapError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading Mapbox GL JS...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <MapControls onLayerToggle={toggleLayer} activeLayer={activeLayer} onActiveLayerChange={setActiveLayer} />

      <TrafficLegend />

      {selectedVehicle && <VehicleInfoPanel vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />}

      {showIncidentModal && (
        <IncidentReportModal
          location={reportLocation}
          onSubmit={handleIncidentReport}
          onClose={() => {
            setShowIncidentModal(false)
            setReportLocation(null)
          }}
        />
      )}

      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>
    </div>
  )
}
