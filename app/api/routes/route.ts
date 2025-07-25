import { type NextRequest, NextResponse } from "next/server"

// Mock OSRM-like routing service
export async function POST(request: NextRequest) {
  const { start, end, vehicle_type = "car", avoid_congestion = false } = await request.json()

  // Mock route calculation
  const route = {
    distance: Math.random() * 10000 + 1000, // meters
    duration: Math.random() * 1800 + 300, // seconds
    geometry: {
      type: "LineString",
      coordinates: [start, [start[0] + 0.001, start[1] + 0.001], [end[0] - 0.001, end[1] - 0.001], end],
    },
    legs: [
      {
        distance: Math.random() * 10000 + 1000,
        duration: Math.random() * 1800 + 300,
        steps: [
          {
            instruction: "Head north on Main Road",
            distance: 500,
            duration: 60,
          },
          {
            instruction: "Turn right onto Temple Street",
            distance: 800,
            duration: 120,
          },
          {
            instruction: "Continue straight to destination",
            distance: 300,
            duration: 45,
          },
        ],
      },
    ],
    vehicle_type,
    priority: vehicle_type === "ambulance" || vehicle_type === "fire" ? "emergency" : "normal",
  }

  // Add emergency route optimization
  if (vehicle_type === "ambulance" || vehicle_type === "fire") {
    route.duration *= 0.7 // 30% faster emergency route
    route.legs[0].steps.unshift({
      instruction: "Emergency route - traffic signals will be coordinated",
      distance: 0,
      duration: 0,
    })
  }

  return NextResponse.json({
    success: true,
    route,
  })
}
