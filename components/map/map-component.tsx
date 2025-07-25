"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { useSocket } from "@/components/providers/socket-provider"
import { MapControls } from "./map-controls"
import { IncidentReportModal } from "./incident-report-modal"
import { VehicleInfoPanel } from "./vehicle-info-panel"
import { TrafficLegend } from "./traffic-legend"
import "mapbox-gl/dist/mapbox-gl.css"

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
  const map = useRef<mapboxgl.Map | null>(null)
  const { socket, isConnected } = useSocket()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [reportLocation, setReportLocation] = useState<[number, number] | null>(null)
  const [activeLayer, setActiveLayer] = useState<string>("all")

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test"

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: KOTTAKKAL_CENTER,
      zoom: 13,
      pitch: 45,
      bearing: 0,
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.current.addControl(
      new mapboxgl.GeolocateControl({
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

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    socket.on("vehicle-update", (vehicleData: Vehicle) => {
      setVehicles((prev) => {
        const updated = prev.filter((v) => v.id !== vehicleData.id)
        return [...updated, vehicleData]
      })
      updateVehicleOnMap(vehicleData)
    })

    socket.on("incident-update", (incidentData: Incident) => {
      setIncidents((prev) => {
        const updated = prev.filter((i) => i.id !== incidentData.id)
        return [...updated, incidentData]
      })
      updateIncidentOnMap(incidentData)
    })

    socket.on("traffic-update", (trafficData: any) => {
      updateTrafficLayer(trafficData)
    })

    return () => {
      socket.off("vehicle-update")
      socket.off("incident-update")
      socket.off("traffic-update")
    }
  }, [socket, isConnected])

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

      // Add layer
      map.current!.addLayer({
        id: `${type}-vehicles-layer`,
        type: "symbol",
        source: `${type}-vehicles`,
        layout: {
          "icon-image": getVehicleIcon(type),
          "icon-size": type === "ambulance" || type === "fire" ? 1.2 : 1.0,
          "icon-allow-overlap": true,
          "text-field": ["get", "id"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-size": 12,
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
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
      type: "symbol",
      source: "incidents",
      layout: {
        "icon-image": "warning-15",
        "icon-size": 1.5,
        "icon-allow-overlap": true,
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

  const getVehicleIcon = (type: string): string => {
    const icons = {
      ambulance: "hospital-15",
      fire: "fire-station-15",
      school_bus: "school-15",
      city_bus: "bus-15",
      normal: "car-15",
    }
    return icons[type as keyof typeof icons] || "car-15"
  }

  const updateVehicleOnMap = (vehicle: Vehicle) => {
    if (!map.current) return

    const source = map.current.getSource(`${vehicle.type}-vehicles`) as mapboxgl.GeoJSONSource
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

    const source = map.current.getSource("incidents") as mapboxgl.GeoJSONSource
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

    const source = map.current.getSource("traffic-congestion") as mapboxgl.GeoJSONSource
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

    mockVehicles.forEach((vehicle) => {
      updateVehicleOnMap(vehicle)
    })
    setVehicles(mockVehicles)

    // Simulate real-time updates
    setInterval(() => {
      mockVehicles.forEach((vehicle) => {
        // Simulate movement
        vehicle.coordinates[0] += (Math.random() - 0.5) * 0.001
        vehicle.coordinates[1] += (Math.random() - 0.5) * 0.001
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
    if (socket && reportLocation) {
      const incident: Incident = {
        id: `incident-${Date.now()}`,
        type: incidentData.type,
        coordinates: reportLocation,
        description: incidentData.description,
        votes: 0,
        timestamp: new Date(),
      }

      socket.emit("report-incident", incident)
      setShowIncidentModal(false)
      setReportLocation(null)
    }
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
