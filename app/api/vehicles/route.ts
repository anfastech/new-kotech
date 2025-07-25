import { type NextRequest, NextResponse } from "next/server"

// Mock vehicle data
const vehicles = [
  {
    id: "amb-001",
    type: "ambulance",
    coordinates: [75.9064, 10.9847],
    status: "emergency",
    driver: "Rajesh Kumar",
    contact: "+91-9876543210",
  },
  {
    id: "fire-001",
    type: "fire",
    coordinates: [75.908, 10.986],
    status: "responding",
    driver: "Suresh Nair",
    contact: "+91-9876543211",
  },
  {
    id: "bus-001",
    type: "school_bus",
    coordinates: [75.905, 10.983],
    status: "route",
    driver: "Priya Menon",
    route: "Route A - Government School",
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
