"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Heart, Flame, Bus, Car, Phone, MapPin, Clock, Route, Navigation, Target } from "lucide-react"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  timestamp: number
}

interface UserLocation {
  coordinates: [number, number]
  accuracy: number
  heading?: number
  speed?: number
  timestamp: number
}

interface VehicleInfoPanelProps {
  vehicle: Vehicle
  onClose: () => void
  routeData?: any
  onShowRoute?: () => void
  userLocation?: UserLocation | null
}

export function VehicleInfoPanel({ vehicle, onClose, routeData, onShowRoute, userLocation }: VehicleInfoPanelProps) {
  const getVehicleIcon = () => {
    switch (vehicle.type) {
      case "ambulance":
        return <Heart className="w-5 h-5 text-red-500" />
      case "fire":
        return <Flame className="w-5 h-5 text-orange-500" />
      case "school_bus":
      case "city_bus":
        return <Bus className="w-5 h-5 text-blue-500" />
      case "normal":
        return <Car className="w-5 h-5 text-gray-500" />
      default:
        return <Car className="w-5 h-5 text-gray-500" />
    }
  }

  const getVehicleTitle = () => {
    switch (vehicle.type) {
      case "ambulance":
        return "Ambulance"
      case "fire":
        return "Fire Truck"
      case "school_bus":
        return "School Bus"
      case "city_bus":
        return "City Bus"
      case "normal":
        return "Vehicle"
      default:
        return "Vehicle"
    }
  }

  const getStatusColor = () => {
    switch (vehicle.status) {
      case "emergency":
        return "destructive"
      case "active":
        return "default"
      case "responding":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getEmergencyContact = () => {
    switch (vehicle.type) {
      case "ambulance":
        return "108"
      case "fire":
        return "101"
      default:
        return null
    }
  }

  const calculateDistance = () => {
    if (!userLocation) return null

    const R = 6371 // Earth's radius in kilometers
    const dLat = ((vehicle.coordinates[1] - userLocation.coordinates[1]) * Math.PI) / 180
    const dLon = ((vehicle.coordinates[0] - userLocation.coordinates[0]) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.coordinates[1] * Math.PI) / 180) *
        Math.cos((vehicle.coordinates[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <Card className="absolute top-4 left-96 w-80 shadow-lg z-10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getVehicleIcon()}
            <CardTitle className="text-lg">{getVehicleTitle()}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vehicle Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Vehicle ID:</span>
            <span className="text-sm text-gray-600">{vehicle.id}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={getStatusColor()}>{vehicle.status}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Location:</span>
            <div className="text-sm text-gray-600 text-right">
              <div>{vehicle.coordinates[1].toFixed(4)}</div>
              <div>{vehicle.coordinates[0].toFixed(4)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Update:</span>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(vehicle.timestamp)}</span>
            </div>
          </div>

          {userLocation && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Distance:</span>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Target className="w-3 h-3" />
                <span>{calculateDistance()}</span>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Emergency Contact */}
        {getEmergencyContact() && (
          <>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-red-600">Emergency Contact</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                onClick={() => window.open(`tel:${getEmergencyContact()}`, "_self")}
              >
                <Phone className="w-4 h-4" />
                <span>Call {getEmergencyContact()}</span>
              </Button>
            </div>
            <Separator />
          </>
        )}

        {/* Route Information */}
        {routeData && (
          <>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Route Information</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Distance:</span>
                  <span>{(routeData.distance / 1000).toFixed(1)} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration:</span>
                  <span>{Math.round(routeData.duration / 60)} min</span>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {vehicle.type === "ambulance" && onShowRoute && (
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center space-x-2 bg-transparent"
              onClick={onShowRoute}
            >
              <Route className="w-4 h-4" />
              <span>Show Route</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center space-x-2 bg-transparent"
            onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${vehicle.coordinates[1]},${vehicle.coordinates[0]}`
              window.open(url, "_blank")
            }}
          >
            <Navigation className="w-4 h-4" />
            <span>Navigate to Vehicle</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center space-x-2 bg-transparent"
            onClick={() => {
              const coords = `${vehicle.coordinates[1]},${vehicle.coordinates[0]}`
              navigator.clipboard.writeText(coords)
            }}
          >
            <MapPin className="w-4 h-4" />
            <span>Copy Coordinates</span>
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click "Navigate" to open in Google Maps</p>
          <p>• Emergency vehicles have priority routing</p>
          {userLocation && <p>• Distance calculated from your location</p>}
        </div>
      </CardContent>
    </Card>
  )
}
