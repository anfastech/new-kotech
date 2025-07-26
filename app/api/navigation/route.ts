import { type NextRequest, NextResponse } from "next/server"

// Mapbox API configuration
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const MAPBOX_DIRECTIONS_API = "https://api.mapbox.com/directions/v5/mapbox/driving"

// Traffic data for Kottakkal area (for fallback)
const trafficConditions: { [key: string]: { congestion: number; speed: number } } = {
  "75.7804,11.2588": { congestion: 0.3, speed: 25 }, // Kottakkal center
  "75.7814,11.2598": { congestion: 0.7, speed: 15 }, // High congestion area
  "75.7824,11.2608": { congestion: 0.2, speed: 30 }, // Low congestion
  "75.7834,11.2618": { congestion: 0.5, speed: 20 }, // Medium congestion
}

// Road network data for Kottakkal with more detailed road segments
const roadNetwork: { [key: string]: {
  name: string;
  coordinates: [number, number][];
  speed_limit: number;
  lanes: number;
  type: string;
} } = {
  "main_road": {
    name: "Kottakkal Main Road",
    coordinates: [[75.7804, 11.2588], [75.7814, 11.2598], [75.7824, 11.2608], [75.7834, 11.2618], [75.7844, 11.2628]],
    speed_limit: 40,
    lanes: 2,
    type: "primary"
  },
  "temple_street": {
    name: "Temple Street",
    coordinates: [[75.7814, 11.2598], [75.7834, 11.2618], [75.7854, 11.2638]],
    speed_limit: 30,
    lanes: 1,
    type: "secondary"
  },
  "hospital_road": {
    name: "Hospital Road",
    coordinates: [[75.7804, 11.2588], [75.7844, 11.2628], [75.7864, 11.2648]],
    speed_limit: 35,
    lanes: 2,
    type: "emergency"
  },
  "bus_stand_road": {
    name: "Bus Stand Road",
    coordinates: [[75.7824, 11.2608], [75.7844, 11.2628], [75.7864, 11.2648], [76.0047806, 11.0017263]],
    speed_limit: 35,
    lanes: 2,
    type: "primary"
  },
  "custom_point_road": {
    name: "Custom Point Access Road",
    coordinates: [[75.994819, 11.006126], [75.9900, 11.0100], [75.9850, 11.0150], [75.9800, 11.0200]],
    speed_limit: 30,
    lanes: 1,
    type: "secondary"
  }
}

// Road nodes for shortest path calculation
const roadNodes: { [key: string]: {
  coordinates: [number, number];
  connections: string[];
} } = {
  "custom_point": { coordinates: [75.994819, 11.006126], connections: ["custom_point_road"] },
  "main_junction": { coordinates: [75.7804, 11.2588], connections: ["main_road", "hospital_road"] },
  "temple_junction": { coordinates: [75.7814, 11.2598], connections: ["main_road", "temple_street"] },
  "hospital_junction": { coordinates: [75.7844, 11.2628], connections: ["main_road", "hospital_road", "bus_stand_road"] },
  "bus_stand": { coordinates: [76.0047806, 11.0017263], connections: ["bus_stand_road"] },
  "custom_road_junction": { coordinates: [75.9800, 11.0200], connections: ["custom_point_road", "main_road"] }
}

// Traffic signals and intersections
const intersections = [
  {
    id: "int_1",
    coordinates: [75.7814, 11.2598],
    name: "Main Road - Temple Street Junction",
    signals: true,
    emergency_priority: true
  },
  {
    id: "int_2", 
    coordinates: [75.7824, 11.2608],
    name: "Hospital Road Junction",
    signals: true,
    emergency_priority: true
  }
]

interface RouteRequest {
  origin: [number, number]
  destination: [number, number]
  vehicle_type: "ambulance" | "fire" | "police" | "bus" | "car" | "motorcycle"
  avoid_congestion?: boolean
  prefer_highways?: boolean
  avoid_tolls?: boolean
  departure_time?: string
  traffic_conditions?: "live" | "historical" | "predicted"
}

interface RouteResponse {
  routes: Route[]
  traffic_summary: TrafficSummary
  emergency_optimizations?: EmergencyOptimization[]
}

interface Route {
  id: string
  distance: number // meters
  duration: number // seconds
  traffic_delay: number // seconds
  geometry: {
    type: "LineString"
    coordinates: [number, number][]
  }
  legs: RouteLeg[]
  summary: RouteSummary
  emergency_priority: boolean
  traffic_conditions: TrafficCondition[]
}

interface RouteLeg {
  distance: number
  duration: number
  steps: RouteStep[]
  traffic_conditions: TrafficCondition[]
}

interface RouteStep {
  instruction: string
  distance: number
  duration: number
  maneuver: {
    type: string
    instruction: string
    bearing_before: number
    bearing_after: number
  }
  road_name?: string
  speed_limit?: number
  traffic_light?: boolean
  emergency_access?: boolean
}

interface RouteSummary {
  total_distance: number
  total_duration: number
  traffic_delay: number
  fuel_consumption?: number
  co2_emissions?: number
  road_types: string[]
  traffic_signals: number
  emergency_priorities: number
}

interface TrafficCondition {
  location: [number, number]
  congestion_level: number // 0-1
  average_speed: number // km/h
  delay_factor: number // multiplier
  road_works?: boolean
  incidents?: string[]
}

interface TrafficSummary {
  total_congestion: number
  average_speed: number
  total_delay: number
  incident_count: number
  road_works_count: number
}

interface EmergencyOptimization {
  type: "traffic_signal_priority" | "lane_assignment" | "speed_limit_override"
  description: string
  estimated_time_saved: number
  affected_intersections: string[]
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = coord1[1] * Math.PI / 180
  const φ2 = coord2[1] * Math.PI / 180
  const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180
  const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

// Get route from Mapbox Directions API
const getMapboxRoute = async (origin: [number, number], destination: [number, number]): Promise<any> => {
  if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error("Mapbox access token not configured")
  }

  const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`
  const url = `${MAPBOX_DIRECTIONS_API}/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full&steps=true&annotations=distance,duration`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    // console.log("Mapbox Directions API response:", data)
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0]
    } else {
      throw new Error("No route found in Mapbox response")
    }
  } catch (error) {
    // console.error("Mapbox Directions API error:", error)
    throw error
  }
}

// Find the nearest road point to a given coordinate
const findNearestRoadPoint = (point: [number, number]): { roadName: string, nearestPoint: [number, number], distance: number } => {
  let nearestRoad = ""
  let nearestPoint: [number, number] = [0, 0]
  let minDistance = Infinity

  // Check all road segments
  Object.entries(roadNetwork).forEach(([roadName, road]) => {
    road.coordinates.forEach(coord => {
      const distance = calculateDistance(point, coord)
      if (distance < minDistance) {
        minDistance = distance
        nearestRoad = roadName
        nearestPoint = coord
      }
    })
  })

  return { roadName: nearestRoad, nearestPoint, distance: minDistance }
}

// Find the nearest road node to a given coordinate
const findNearestRoadNode = (point: [number, number]): { nodeName: string, coordinates: [number, number], distance: number } => {
  let nearestNode = ""
  let nearestCoords: [number, number] = [0, 0]
  let minDistance = Infinity

  Object.entries(roadNodes).forEach(([nodeName, node]) => {
    const distance = calculateDistance(point, node.coordinates)
    if (distance < minDistance) {
      minDistance = distance
      nearestNode = nodeName
      nearestCoords = node.coordinates
    }
  })

  return { nodeName: nearestNode, coordinates: nearestCoords, distance: minDistance }
}

// Calculate shortest path using Dijkstra's algorithm
const calculateShortestPath = (startNode: string, endNode: string): string[] => {
  const distances: { [key: string]: number } = {}
  const previous: { [key: string]: string } = {}
  const unvisited = new Set<string>()
  
  // Initialize distances
  Object.keys(roadNodes).forEach(node => {
    distances[node] = Infinity
    unvisited.add(node)
  })
  distances[startNode] = 0

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current = ""
    let minDistance = Infinity
    unvisited.forEach(node => {
      if (distances[node] < minDistance) {
        minDistance = distances[node]
        current = node
      }
    })

    if (current === "" || current === endNode) break

    unvisited.delete(current)

    // Check neighbors through road connections
    const currentConnections = roadNodes[current].connections
    currentConnections.forEach(roadName => {
      const road = roadNetwork[roadName]
      road.coordinates.forEach(coord => {
        // Find nodes connected to this road
        Object.entries(roadNodes).forEach(([neighborNode, neighbor]) => {
          if (neighbor.coordinates[0] === coord[0] && neighbor.coordinates[1] === coord[1]) {
            if (unvisited.has(neighborNode)) {
              const distance = calculateDistance(roadNodes[current].coordinates, neighbor.coordinates)
              const totalDistance = distances[current] + distance
              
              if (totalDistance < distances[neighborNode]) {
                distances[neighborNode] = totalDistance
                previous[neighborNode] = current
              }
            }
          }
        })
      })
    })
  }

  // Reconstruct path
  const path: string[] = []
  let current = endNode
  while (current) {
    path.unshift(current)
    current = previous[current]
  }

  return path
}

// Generate route waypoints following actual road paths
const generateRouteWaypoints = (origin: [number, number], destination: [number, number], avoidCongestion: boolean = false): [number, number][] => {
  const waypoints: [number, number][] = []
  
  try {
    // Find the actual road paths that connect origin to destination
    const roadPath = findRoadPathBetweenPoints(origin, destination)
    
    if (roadPath.length > 0) {
      // Use the actual road path
      waypoints.push(origin) // Start at origin
      waypoints.push(...roadPath) // Add all road waypoints
      waypoints.push(destination) // End at destination
      
      // console.log("Generated road-following route:", {
      //   origin: origin,
      //   destination: destination,
      //   roadPathLength: roadPath.length,
      //   totalWaypoints: waypoints.length
      // })
    } else {
      // Fallback: create a route using road segments
      const fallbackPath = createRoadFollowingPath(origin, destination)
      waypoints.push(origin, ...fallbackPath, destination)
    }
    
  } catch (error) {
    // console.error("Error generating road-following route:", error)
    // Final fallback to simple route
    waypoints.push(origin, destination)
  }
  
  return waypoints
}

// Find actual road path between two points
const findRoadPathBetweenPoints = (origin: [number, number], destination: [number, number]): [number, number][] => {
  const roadPath: [number, number][] = []
  
  // Check if we're routing between known points (custom-point to bus-stand)
  if (isCustomPointToBusStand(origin, destination)) {
    // Use the specific road path for this route
    return getCustomPointToBusStandPath()
  }
  
  // For other routes, find the best road path
  const originRoad = findNearestRoadPoint(origin)
  const destRoad = findNearestRoadPoint(destination)
  
  // Get road coordinates and create path
  const originRoadCoords = roadNetwork[originRoad.roadName]?.coordinates || []
  const destRoadCoords = roadNetwork[destRoad.roadName]?.coordinates || []
  
  // Combine road coordinates to create path
  roadPath.push(...originRoadCoords as [number, number][])
  roadPath.push(...destRoadCoords as [number, number][])
  
  return roadPath
}

// Check if routing from custom point to bus stand
const isCustomPointToBusStand = (origin: [number, number], destination: [number, number]): boolean => {
  const customPoint: [number, number] = [75.994819, 11.006126]
  const busStand: [number, number] = [76.0047806, 11.0017263]
  
  const originMatch = Math.abs(origin[0] - customPoint[0]) < 0.001 && Math.abs(origin[1] - customPoint[1]) < 0.001
  const destMatch = Math.abs(destination[0] - busStand[0]) < 0.001 && Math.abs(destination[1] - busStand[1]) < 0.001
  
  return originMatch && destMatch
}

// Get specific road path from custom point to bus stand
const getCustomPointToBusStandPath = (): [number, number][] => {
  // Create a realistic road path following actual roads
  return [
    [75.994819, 11.006126], // Custom Point
    [75.9900, 11.0100],     // Custom Point Access Road
    [75.9850, 11.0150],     // Continue on access road
    [75.9800, 11.0200],     // Junction with main road
    [75.7804, 11.2588],     // Main Road Junction
    [75.7814, 11.2598],     // Main Road
    [75.7824, 11.2608],     // Continue on main road
    [75.7834, 11.2618],     // Main Road
    [75.7844, 11.2628],     // Hospital Junction
    [75.7864, 11.2648],     // Bus Stand Road
    [76.0047806, 11.0017263] // Bus Stand
  ]
}

// Create road-following path for general routes
const createRoadFollowingPath = (origin: [number, number], destination: [number, number]): [number, number][] => {
  const path: [number, number][] = []
  
  // Find nearest roads
  const originRoad = findNearestRoadPoint(origin)
  const destRoad = findNearestRoadPoint(destination)
  
  // Get road coordinates
  const originRoadData = roadNetwork[originRoad.roadName]
  const destRoadData = roadNetwork[destRoad.roadName]
  
  if (originRoadData && destRoadData) {
    // Add origin road coordinates
    path.push(...originRoadData.coordinates as [number, number][])
    
    // Add destination road coordinates
    path.push(...destRoadData.coordinates as [number, number][])
  }
  
  return path
}

// Calculate traffic conditions along route
const calculateTrafficConditions = (waypoints: [number, number][]): TrafficCondition[] => {
  return waypoints.map((point, index) => {
    const key = `${point[0].toFixed(4)},${point[1].toFixed(4)}`
    const traffic = trafficConditions[key] || { congestion: 0.2, speed: 30 }
    
    return {
      location: point,
      congestion_level: traffic.congestion,
      average_speed: traffic.speed,
      delay_factor: 1 + (traffic.congestion * 0.5),
      road_works: Math.random() > 0.9, // 10% chance of road works
      incidents: Math.random() > 0.95 ? ["minor_accident"] : []
    }
  })
}

// Generate turn-by-turn directions
const generateRouteSteps = (waypoints: [number, number][], vehicleType: string): RouteStep[] => {
  const steps: RouteStep[] = []
  
  for (let i = 0; i < waypoints.length - 1; i++) {
    const current = waypoints[i]
    const next = waypoints[i + 1]
    const distance = calculateDistance(current, next)
    
    let instruction = ""
    let maneuverType = "continue"
    
    if (i === 0) {
      instruction = `Head ${next[0] > current[0] ? 'east' : 'west'} on Kottakkal Main Road`
    } else if (i === waypoints.length - 2) {
      instruction = "Continue straight to destination"
    } else {
      const angle = Math.atan2(next[1] - current[1], next[0] - current[0]) * 180 / Math.PI
      if (angle > 45 && angle <= 135) {
        instruction = "Turn right"
        maneuverType = "turn"
      } else if (angle > -135 && angle <= -45) {
        instruction = "Turn left"
        maneuverType = "turn"
      } else {
        instruction = "Continue straight"
      }
    }
    
    steps.push({
      instruction,
      distance: Math.round(distance),
      duration: Math.round(distance / 8.33), // Assuming 30 km/h average
      maneuver: {
        type: maneuverType,
        instruction,
        bearing_before: 0,
        bearing_after: 0
      },
      road_name: i === 0 ? "Kottakkal Main Road" : "Local Road",
      speed_limit: 30,
      traffic_light: Math.random() > 0.7,
      emergency_access: vehicleType === "ambulance" || vehicleType === "fire"
    })
  }
  
  return steps
}

// Calculate emergency optimizations
const calculateEmergencyOptimizations = (route: Route, vehicleType: string): EmergencyOptimization[] => {
  if (vehicleType !== "ambulance" && vehicleType !== "fire" && vehicleType !== "police") {
    return []
  }
  
  const optimizations: EmergencyOptimization[] = []
  
  // Traffic signal priority
  const trafficSignals = route.legs.flatMap(leg => 
    leg.steps.filter(step => step.traffic_light)
  ).length
  
  if (trafficSignals > 0) {
    optimizations.push({
      type: "traffic_signal_priority",
      description: `Traffic signals will be coordinated for ${vehicleType}`,
      estimated_time_saved: trafficSignals * 30, // 30 seconds per signal
      affected_intersections: intersections.map(int => int.id)
    })
  }
  
  // Lane assignment
  optimizations.push({
    type: "lane_assignment",
    description: "Emergency lane access granted",
    estimated_time_saved: 60,
    affected_intersections: []
  })
  
  return optimizations
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequest = await request.json()
    const { origin, destination, vehicle_type, avoid_congestion = false } = body
    
    // console.log("Navigation request:", { origin, destination, vehicle_type })

    // Try to get route from Mapbox Directions API first
    try {
      const mapboxRoute = await getMapboxRoute(origin, destination)
      
      // Convert Mapbox route to our format
      const route: Route = {
        id: "mapbox_route",
        distance: mapboxRoute.distance,
        duration: mapboxRoute.duration,
        traffic_delay: 0, // Mapbox doesn't provide traffic delay in basic API
        geometry: mapboxRoute.geometry,
        legs: [{
          distance: mapboxRoute.distance,
          duration: mapboxRoute.duration,
          steps: mapboxRoute.legs?.[0]?.steps?.map((step: any) => ({
            instruction: step.maneuver.instruction,
            distance: step.distance,
            duration: step.duration,
            maneuver: {
              type: step.maneuver.type,
              instruction: step.maneuver.instruction,
              bearing_before: step.maneuver.bearing_before || 0,
              bearing_after: step.maneuver.bearing_after || 0
            },
            road_name: step.name,
            speed_limit: 30,
            traffic_light: false,
            emergency_access: vehicle_type === "ambulance" || vehicle_type === "fire" || vehicle_type === "police"
          })) || [],
          traffic_conditions: []
        }],
        summary: {
          total_distance: mapboxRoute.distance,
          total_duration: mapboxRoute.duration,
          traffic_delay: 0,
          fuel_consumption: mapboxRoute.distance / 1000 * 0.1,
          co2_emissions: mapboxRoute.distance / 1000 * 0.2,
          road_types: ["primary", "secondary"],
          traffic_signals: 0,
          emergency_priorities: 0
        },
        emergency_priority: vehicle_type === "ambulance" || vehicle_type === "fire" || vehicle_type === "police",
        traffic_conditions: []
      }

      const trafficSummary: TrafficSummary = {
        total_congestion: 0.2,
        average_speed: 30,
        total_delay: 0,
        incident_count: 0,
        road_works_count: 0
      }

      const response: RouteResponse = {
        routes: [route],
        traffic_summary: trafficSummary
      }

      console.log("Mapbox route created successfully:", {
        distance: (route.distance / 1000).toFixed(1) + "km",
        duration: Math.round(route.duration / 60) + "min",
        coordinates: route.geometry.coordinates.length
      })

      return NextResponse.json({
        success: true,
        data: response,
        metadata: {
          source: "mapbox_directions_api",
          timestamp: new Date().toISOString(),
          coordinates: { origin, destination }
        }
      })

    } catch (mapboxError) {
      console.error("Mapbox API failed, falling back to mock route:", mapboxError)
      
      // Fallback to mock route generation
      const waypoints = generateRouteWaypoints(origin, destination, avoid_congestion)
      const routeTrafficConditions = calculateTrafficConditions(waypoints)
      const steps = generateRouteSteps(waypoints, vehicle_type)
      
      const totalDistance = waypoints.reduce((total, point, i) => {
        if (i === 0) return 0
        return total + calculateDistance(waypoints[i-1], point)
      }, 0)
      
      const baseDuration = totalDistance / 8.33 // 30 km/h average speed
      const trafficDelay = routeTrafficConditions.reduce((delay, condition) => 
        delay + (condition.delay_factor - 1) * baseDuration * 0.2, 0
      )
      const totalDuration = baseDuration + trafficDelay
      
      // Emergency vehicle optimizations
      const emergencyOptimizations = calculateEmergencyOptimizations({
        id: "fallback_route",
        distance: totalDistance,
        duration: totalDuration,
        traffic_delay: trafficDelay,
        geometry: { type: "LineString", coordinates: waypoints },
        legs: [{
          distance: totalDistance,
          duration: totalDuration,
          steps,
          traffic_conditions: routeTrafficConditions
        }],
        summary: {
          total_distance: totalDistance,
          total_duration: totalDuration,
          traffic_delay: trafficDelay,
          road_types: ["primary", "secondary"],
          traffic_signals: steps.filter(s => s.traffic_light).length,
          emergency_priorities: steps.filter(s => s.emergency_access).length
        },
        emergency_priority: vehicle_type === "ambulance" || vehicle_type === "fire" || vehicle_type === "police",
        traffic_conditions: routeTrafficConditions
      }, vehicle_type)
      
      // Apply emergency vehicle optimizations
      let optimizedDuration = totalDuration
      if (emergencyOptimizations.length > 0) {
        const timeSaved = emergencyOptimizations.reduce((total, opt) => total + opt.estimated_time_saved, 0)
        optimizedDuration = Math.max(totalDuration - timeSaved, totalDuration * 0.7)
      }
      
      const route: Route = {
        id: "fallback_route",
        distance: totalDistance,
        duration: optimizedDuration,
        traffic_delay: trafficDelay,
        geometry: {
          type: "LineString",
          coordinates: waypoints
        },
        legs: [{
          distance: totalDistance,
          duration: optimizedDuration,
          steps,
          traffic_conditions: routeTrafficConditions
        }],
        summary: {
          total_distance: totalDistance,
          total_duration: optimizedDuration,
          traffic_delay: trafficDelay,
          fuel_consumption: totalDistance / 1000 * 0.1,
          co2_emissions: totalDistance / 1000 * 0.2,
          road_types: ["primary", "secondary"],
          traffic_signals: steps.filter(s => s.traffic_light).length,
          emergency_priorities: steps.filter(s => s.emergency_access).length
        },
        emergency_priority: vehicle_type === "ambulance" || vehicle_type === "fire" || vehicle_type === "police",
        traffic_conditions: routeTrafficConditions
      }
      
      const trafficSummary: TrafficSummary = {
        total_congestion: routeTrafficConditions.reduce((sum, tc) => sum + tc.congestion_level, 0) / routeTrafficConditions.length,
        average_speed: routeTrafficConditions.reduce((sum, tc) => sum + tc.average_speed, 0) / routeTrafficConditions.length,
        total_delay: trafficDelay,
        incident_count: routeTrafficConditions.reduce((sum, tc) => sum + (tc.incidents?.length || 0), 0),
        road_works_count: routeTrafficConditions.filter(tc => tc.road_works).length
      }
      
      const response: RouteResponse = {
        routes: [route],
        traffic_summary: trafficSummary,
        emergency_optimizations: emergencyOptimizations.length > 0 ? emergencyOptimizations : undefined
      }
      
      console.log("Fallback route created:", {
        distance: (route.distance / 1000).toFixed(1) + "km",
        duration: Math.round(route.duration / 60) + "min",
        coordinates: route.geometry.coordinates.length
      })
      
      return NextResponse.json({
        success: true,
        data: response,
        metadata: {
          source: "fallback_mock_route",
          timestamp: new Date().toISOString(),
          coordinates: { origin, destination }
        }
      })
    }
    
  } catch (error) {
    console.error("Navigation API error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to calculate route",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  
     if (type === "traffic") {
     return NextResponse.json({
       success: true,
       data: {
         traffic_conditions: trafficConditions,
         intersections,
         road_network: roadNetwork
       }
     })
   }
  
  return NextResponse.json({
    success: true,
    data: {
      available_endpoints: ["POST /api/navigation", "GET /api/navigation?type=traffic"],
      supported_vehicle_types: ["ambulance", "fire", "police", "bus", "car", "motorcycle"],
      area_coverage: "Kottakkal urban area",
      features: [
        "Real-time traffic optimization",
        "Emergency vehicle prioritization", 
        "Turn-by-turn navigation",
        "Traffic signal coordination",
        "Incident avoidance"
      ]
    }
  })
} 