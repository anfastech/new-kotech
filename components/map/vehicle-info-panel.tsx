"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, Clock, User, Phone, Route } from "lucide-react"

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
      available: "bg-green-500",
      offline: "bg-gray-500",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  return (
    <div className="absolute bottom-4 left-4 w-80">
      <Card className="p-4 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
            <h3 className="font-semibold">{getVehicleTypeLabel(vehicle.type)}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">ID:</span>
            <span>{vehicle.id}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Location:</span>
            <span>
              {vehicle.coordinates[1].toFixed(4)}, {vehicle.coordinates[0].toFixed(4)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Status:</span>
            <Badge variant="secondary" className="capitalize">
              {vehicle.status}
            </Badge>
          </div>

          {vehicle.type === "ambulance" && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Emergency:</span>
              <span className="text-red-600 font-medium">108</span>
            </div>
          )}

          {vehicle.type === "fire" && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Emergency:</span>
              <span className="text-red-600 font-medium">101</span>
            </div>
          )}

          {vehicle.route && (
            <div className="flex items-center gap-2 text-sm">
              <Route className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Route:</span>
              <span>{vehicle.route.length} waypoints</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
            Track Vehicle
          </Button>
          <Button size="sm" className="flex-1">
            Contact
          </Button>
        </div>
      </Card>
    </div>
  )
}
