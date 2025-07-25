import { type NextRequest, NextResponse } from "next/server"

// Mock OSRM-like routing service for Kottakkal area
export async function POST(request: NextRequest) {
  const { start, end, vehicle_type = "car", avoid_congestion = false } = await request.json()

  // Generate realistic route coordinates for Kottakkal area
  const generateRouteCoordinates = (start: [number, number], end: [number, number]) => {
    const [startLng, startLat] = start
    const [endLng, endLat] = end
    
    // Create waypoints along the route
    const waypoints = []
    const steps = 5 // Number of waypoints
    
    for (let i = 1; i < steps; i++) {
      const progress = i / steps
      const lng = startLng + (endLng - startLng) * progress + (Math.random() - 0.5) * 0.001
      const lat = startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.001
      waypoints.push([lng, lat])
    }
    
    return [start, ...waypoints, end]
  }

  const coordinates = generateRouteCoordinates(start, end)
  
  // Calculate distance and duration
  const distance = Math.random() * 5000 + 1000 // 1-6 km
  const baseDuration = distance / 1000 * 120 // 2 minutes per km base
  
  // Adjust duration based on vehicle type
  let duration = baseDuration
  if (vehicle_type === "ambulance" || vehicle_type === "fire") {
    duration *= 0.6 // 40% faster for emergency vehicles
  } else if (vehicle_type === "school_bus") {
    duration *= 1.2 // 20% slower for school buses
  }

  // Mock route calculation
  const route = {
    distance: distance,
    duration: duration,
    geometry: {
      type: "LineString",
      coordinates: coordinates,
    },
    legs: [
      {
        distance: distance,
        duration: duration,
        steps: [
          {
            instruction: "Head north on Kottakkal Main Road",
            distance: Math.round(distance * 0.3),
            duration: Math.round(duration * 0.3),
          },
          {
            instruction: "Turn right onto Temple Street",
            distance: Math.round(distance * 0.4),
            duration: Math.round(duration * 0.4),
          },
          {
            instruction: "Continue straight to destination",
            distance: Math.round(distance * 0.3),
            duration: Math.round(duration * 0.3),
          },
        ],
      },
    ],
    vehicle_type,
    priority: vehicle_type === "ambulance" || vehicle_type === "fire" ? "emergency" : "normal",
  }

  // Add emergency route optimization
  if (vehicle_type === "ambulance" || vehicle_type === "fire") {
    route.legs[0].steps.unshift({
      instruction: "Emergency route - traffic signals will be coordinated",
      distance: 0,
      duration: 0,
    })
    
    // Add emergency-specific instructions
    route.legs[0].steps.push({
      instruction: "Use emergency lane and siren",
      distance: 0,
      duration: 0,
    })
  }

  return NextResponse.json({
    success: true,
    route,
  })
}
