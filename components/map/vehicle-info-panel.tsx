"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Heart, Flame, Bus, Car, Phone, MapPin, Clock } from "lucide-react"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  timestamp: number
}

interface VehicleInfoPanelProps {
  vehicle: Vehicle
  onClose: () => void
  routeData?: any
  onShowRoute?: () => void
}

export function VehicleInfoPanel({ vehicle, onClose, routeData, onShowRoute }: VehicleInfoPanelProps) {
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "ambulance":
        return <Heart className="w-5 h-5 text-red-500" />
      case "fire":
        return <Flame className="w-5 h-5 text-orange-500" />
      case "school_bus":
        return <Bus className="w-5 h-5 text-yellow-600" />
      case "city_bus":
        return <Bus className="w-5 h-5 text-blue-500" />
      case "normal":
        return <Car className="w-5 h-5 text-gray-500" />
      default:
        return <Car className="w-5 h-5 text-gray-500" />
    }
  }

  const getVehicleTitle = (type: string) => {
    switch (type) {
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

  const getEmergencyContact = (type: string) => {
    switch (type) {
      case "ambulance":
        return "108"
      case "fire":
        return "101"
      default:
        return null
    }
  }

  const formatCoordinates = (coords: [number, number]) => {
    return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const emergencyContact = getEmergencyContact(vehicle.type)

  return (
    <Card className="absolute bottom-4 right-4 w-80 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getVehicleIcon(vehicle.type)}
            <CardTitle className="text-lg">{getVehicleTitle(vehicle.type)}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Vehicle ID:</span>
          <Badge variant="outline">{vehicle.id}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>{vehicle.status}</Badge>
        </div>

        <div className="flex items-start justify-between">
          <span className="text-sm font-medium flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Location:
          </span>
          <span className="text-sm text-gray-600 text-right">{formatCoordinates(vehicle.coordinates)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Last Update:
          </span>
          <span className="text-sm text-gray-600">{formatTimestamp(vehicle.timestamp)}</span>
        </div>

        {vehicle.type === 'ambulance' && onShowRoute && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowRoute}
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Show Route
            </Button>
          </div>
        )}

        {routeData && (
          <div className="pt-3 border-t">
            <div className="text-sm font-medium mb-2">Route Information</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Distance: {(routeData.distance / 1000).toFixed(1)} km</div>
              <div>Duration: {Math.round(routeData.duration / 60)} min</div>
              {routeData.legs?.[0]?.steps && (
                <div className="mt-2">
                  <div className="font-medium">Directions:</div>
                  {routeData.legs[0].steps.slice(0, 3).map((step: any, index: number) => (
                    <div key={index} className="ml-2">• {step.instruction}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {emergencyContact && (
          <div className="pt-3 border-t">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => window.open(`tel:${emergencyContact}`)}
            >
              <Phone className="w-4 h-4 mr-2" />
              Emergency Contact: {emergencyContact}
            </Button>
          </div>
        )}

        <div className="pt-2 text-xs text-gray-500">
          <p>Real-time tracking enabled</p>
          <p>Updates every 3 seconds</p>
        </div>
      </CardContent>
    </Card>
  )
}
