import { NextRequest, NextResponse } from "next/server"

interface ClientLocation {
  id: string
  coordinates: [number, number]
  accuracy: number
  timestamp: number
  source: 'gps' | 'search' | 'manual'
  address?: string
}

// In-memory storage for client locations (in production, use a database)
const clientLocations = new Map<string, ClientLocation>()

// Clean up old locations (older than 5 minutes)
const cleanupOldLocations = () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [id, location] of clientLocations.entries()) {
    if (location.timestamp < fiveMinutesAgo) {
      clientLocations.delete(id)
    }
  }
}

// Run cleanup every minute
setInterval(cleanupOldLocations, 60 * 1000)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      clientId = 'default-client',
      coordinates, 
      accuracy = 0, 
      source = 'gps',
      address 
    } = body

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return NextResponse.json({
        success: false,
        error: "Invalid coordinates format. Expected [longitude, latitude]"
      }, { status: 400 })
    }

    const [longitude, latitude] = coordinates

    // Validate coordinates
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return NextResponse.json({
        success: false,
        error: "Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90"
      }, { status: 400 })
    }

    const location: ClientLocation = {
      id: clientId,
      coordinates: [longitude, latitude],
      accuracy,
      timestamp: Date.now(),
      source,
      address
    }

    // Store the location
    clientLocations.set(clientId, location)

    console.log(`Location updated for client ${clientId}:`, {
      coordinates: [longitude, latitude],
      accuracy,
      source,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        message: "Location updated successfully",
        location: {
          coordinates: [longitude, latitude],
          accuracy,
          timestamp: location.timestamp,
          source
        }
      }
    })

  } catch (error) {
    console.error("Location API error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to update location",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId") || "default-client"

    const location = clientLocations.get(clientId)

    if (!location) {
      return NextResponse.json({
        success: false,
        error: "Location not found for this client",
        data: null
      }, { status: 404 })
    }

    // Check if location is stale (older than 30 seconds)
    const isStale = Date.now() - location.timestamp > 30 * 1000

    return NextResponse.json({
      success: true,
      data: {
        location: {
          coordinates: location.coordinates,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          source: location.source,
          address: location.address,
          isStale
        },
        metadata: {
          totalClients: clientLocations.size,
          lastUpdated: new Date(location.timestamp).toISOString()
        }
      }
    })

  } catch (error) {
    console.error("Location API error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve location",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Get all active client locations
export async function PUT(request: NextRequest) {
  try {
    const locations = Array.from(clientLocations.values()).map(location => ({
      id: location.id,
      coordinates: location.coordinates,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      source: location.source,
      address: location.address,
      isStale: Date.now() - location.timestamp > 30 * 1000
    }))

    return NextResponse.json({
      success: true,
      data: {
        locations,
        metadata: {
          totalClients: clientLocations.size,
          activeClients: locations.filter(l => !l.isStale).length,
          lastUpdated: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error("Location API error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve locations",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 