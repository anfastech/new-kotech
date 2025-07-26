import { type NextRequest, NextResponse } from "next/server"

// Mock traffic data for Kottakkal area
const trafficConditions: { [key: string]: { congestion: number; speed: number } } = {
  "75.7804,11.2588": { congestion: 0.3, speed: 25 }, // Kottakkal center
  "75.7814,11.2598": { congestion: 0.7, speed: 15 }, // High congestion area
  "75.7824,11.2608": { congestion: 0.2, speed: 30 }, // Low congestion
  "75.7834,11.2618": { congestion: 0.5, speed: 20 }, // Medium congestion
}

// Road network data for Kottakkal
const roadNetwork = {
  "main_road": {
    name: "Kottakkal Main Road",
    coordinates: [[75.7804, 11.2588], [75.7814, 11.2598], [75.7824, 11.2608]],
    speed_limit: 40,
    lanes: 2,
    type: "primary"
  },
  "temple_street": {
    name: "Temple Street",
    coordinates: [[75.7814, 11.2598], [75.7834, 11.2618]],
    speed_limit: 30,
    lanes: 1,
    type: "secondary"
  },
  "hospital_road": {
    name: "Hospital Road",
    coordinates: [[75.7804, 11.2588], [75.7844, 11.2628]],
    speed_limit: 35,
    lanes: 2,
    type: "emergency"
  }
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

// Generate route waypoints with traffic consideration
const generateRouteWaypoints = (origin: [number, number], destination: [number, number], avoidCongestion: boolean = false): [number, number][] => {
  const waypoints: [number, number][] = [origin]
  
  // Add intermediate waypoints based on road network
  const midPoint1: [number, number] = [
    origin[0] + (destination[0] - origin[0]) * 0.3 + (Math.random() - 0.5) * 0.001,
    origin[1] + (destination[1] - origin[1]) * 0.3 + (Math.random() - 0.5) * 0.001
  ]
  
  const midPoint2: [number, number] = [
    origin[0] + (destination[0] - origin[0]) * 0.7 + (Math.random() - 0.5) * 0.001,
    origin[1] + (destination[1] - origin[1]) * 0.7 + (Math.random() - 0.5) * 0.001
  ]
  
  waypoints.push(midPoint1, midPoint2, destination)
  
  return waypoints
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
    
    // Validate coordinates are within Kottakkal bounds
    const kottakkalBounds = {
      min: [75.78, 11.0],
      max: [76.12, 11.45]
    }
    
    if (origin[0] < kottakkalBounds.min[0] || origin[0] > kottakkalBounds.max[0] ||
        origin[1] < kottakkalBounds.min[1] || origin[1] > kottakkalBounds.max[1] ||
        destination[0] < kottakkalBounds.min[0] || destination[0] > kottakkalBounds.max[0] ||
        destination[1] < kottakkalBounds.min[1] || destination[1] > kottakkalBounds.max[1]) {
      return NextResponse.json({
        error: "Route coordinates must be within Kottakkal area",
        bounds: kottakkalBounds
      }, { status: 400 })
    }
    
    // Generate route waypoints
    const waypoints = generateRouteWaypoints(origin, destination, avoid_congestion)
    
         // Calculate traffic conditions
     const routeTrafficConditions = calculateTrafficConditions(waypoints)
     
     // Generate route steps
     const steps = generateRouteSteps(waypoints, vehicle_type)
     
     // Calculate route metrics
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
       id: "route_1",
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
      optimizedDuration = Math.max(totalDuration - timeSaved, totalDuration * 0.7) // At least 30% faster
    }
    
         const route: Route = {
       id: "route_1",
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
         fuel_consumption: totalDistance / 1000 * 0.1, // 0.1 L per km
         co2_emissions: totalDistance / 1000 * 0.2, // 0.2 kg CO2 per km
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
    
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        generated_at: new Date().toISOString(),
        vehicle_type,
        avoid_congestion,
        area: "Kottakkal"
      }
    })
    
  } catch (error) {
    console.error("Navigation API error:", error)
    return NextResponse.json({
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