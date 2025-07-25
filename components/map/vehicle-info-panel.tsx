"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Navigation, Clock, Phone, MapPin } from "lucide-react"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  route?: [number, number][]
}

interface VehicleInfoPanelProps {
  vehicle: Vehicle
  onClose: () => void
}

export function VehicleInfoPanel({ vehicle, onClose }: VehicleInfoPanelProps) {
  const getVehicleTypeLabel = (type: string) => {
    const labels = {
      ambulance: "Ambulance",
      fire: "Fire Truck",
      school_bus: "School Bus",
      city_bus: "City Bus",
      normal: "Vehicle",
    }
    return labels[type as keyof typeof labels] || "Vehicle"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      emergency: "bg-red-500",
      responding: "bg-orange-500",
      route: "bg-blue-500",
      idle: "bg-gray-500",
      available: "bg-green-500",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  return (
    <Card className="absolute bottom-4 left-4 w-80 p-4 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
          <h3 className="font-semibold">{getVehicleTypeLabel(vehicle.type)}</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Vehicle ID:</span>
          <Badge variant="outline">{vehicle.id}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge className={getStatusColor(vehicle.status)}>
            {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {vehicle.coordinates[1].toFixed(4)}, {vehicle.coordinates[0].toFixed(4)}
          </span>
        </div>

        {vehicle.type === "ambulance" && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">ETA: 8 minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Distance: 2.3 km</span>
            </div>
          </div>
        )}

        <div className="flex space-x-2 pt-3">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            <Navigation className="w-4 h-4 mr-1" />
            Track
          </Button>
          {(vehicle.type === "ambulance" || vehicle.type === "fire") && (
            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
              <Phone className="w-4 h-4 mr-1" />
              Contact
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
