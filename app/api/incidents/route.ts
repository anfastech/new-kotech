import { type NextRequest, NextResponse } from "next/server"

// Mock incidents data
const incidents = [
  {
    id: "inc-001",
    type: "accident",
    coordinates: [75.907, 10.985],
    description: "Minor collision between two vehicles",
    severity: "medium",
    votes: 5,
    status: "active",
    timestamp: new Date("2024-01-15T10:30:00Z").toISOString(),
  },
  {
    id: "inc-002",
    type: "congestion",
    coordinates: [75.909, 10.987],
    description: "Heavy traffic due to road construction",
    severity: "high",
    votes: 12,
    status: "active",
    timestamp: new Date("2024-01-15T09:15:00Z").toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const type = searchParams.get("type")

  let filteredIncidents = incidents

  if (status) {
    filteredIncidents = filteredIncidents.filter((i) => i.status === status)
  }

  if (type) {
    filteredIncidents = filteredIncidents.filter((i) => i.type === type)
  }

  return NextResponse.json({
    success: true,
    data: filteredIncidents,
    total: filteredIncidents.length,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const newIncident = {
    id: `inc-${Date.now()}`,
    ...body,
    votes: 0,
    status: "active",
    timestamp: new Date().toISOString(),
  }

  incidents.push(newIncident)

  return NextResponse.json({
    success: true,
    data: newIncident,
  })
}
