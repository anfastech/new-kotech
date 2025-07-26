import { type NextRequest, NextResponse } from "next/server"

// Mock vehicle data
const vehicles = [
  {
    id: "amb-001",
    type: "ambulance",
    coordinates: [75.7804, 11.2588],
    status: "active",
    driver: "Dr. Rajesh Kumar",
    contact: "+91-9876543210",
  },
  {
    id: "amb-002",
    type: "ambulance",
    coordinates: [75.7814, 11.2598],
    status: "emergency",
    driver: "Nurse Priya",
    contact: "+91-9876543211",
  },
  {
    id: "fire-001",
    type: "fire",
    coordinates: [75.7824, 11.2608],
    status: "responding",
    driver: "Suresh Nair",
    contact: "+91-9876543212",
  },
  {
    id: "bus-001",
    type: "school_bus",
    coordinates: [75.7834, 11.2618],
    status: "route",
    driver: "Priya Menon",
    route: "Route A - Government School",
  },
                  {
                  id: "police-001",
                  type: "police",
                  coordinates: [75.7834, 11.2618],
                  status: "patrolling",
                  driver: "Officer Rajesh",
                  contact: "+91-9876543213",
                },
                {
                  id: "police-002",
                  type: "police",
                  coordinates: [75.7844, 11.2628],
                  status: "responding",
                  driver: "Officer Priya",
                  contact: "+91-9876543214",
                },
                {
                  id: "bus-002",
                  type: "city_bus",
                  coordinates: [75.7854, 11.2638],
                  status: "route",
                  driver: "Anil Kumar",
                  route: "City Route 1",
                },
              ]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  let filteredVehicles = vehicles

  if (type) {
    filteredVehicles = vehicles.filter((v) => v.type === type)
  }

  return NextResponse.json({
    success: true,
    data: filteredVehicles,
    total: filteredVehicles.length,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newVehicle = {
    id: `${body.type}-${Date.now()}`,
    ...body,
    timestamp: new Date().toISOString(),
  }

  vehicles.push(newVehicle)

  return NextResponse.json({
    success: true,
    data: newVehicle,
  })
}
