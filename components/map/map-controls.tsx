"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Heart, Flame, Bus, Car } from "lucide-react"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "school_bus" | "city_bus" | "normal"
  coordinates: [number, number]
  status: string
  timestamp: number
}

interface MapControlsProps {
  vehicles: Vehicle[]
  visibleLayers: {
    ambulance: boolean
    fire: boolean
    school_bus: boolean
    city_bus: boolean
    normal: boolean
  }
  onLayerToggle: (layer: keyof typeof visibleLayers, visible: boolean) => void
}

export function MapControls({ vehicles, visibleLayers, onLayerToggle }: MapControlsProps) {
  const getVehicleCount = (type: string) => {
    return vehicles.filter((v) => v.type === type).length
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "ambulance":
        return <Heart className="w-4 h-4" />
      case "fire":
        return <Flame className="w-4 h-4" />
      case "school_bus":
        return <Bus className="w-4 h-4" />
      case "city_bus":
        return <Bus className="w-4 h-4" />
      case "normal":
        return <Car className="w-4 h-4" />
      default:
        return <Car className="w-4 h-4" />
    }
  }

  const getVehicleColor = (type: string) => {
    switch (type) {
      case "ambulance":
        return "bg-red-500"
      case "fire":
        return "bg-orange-500"
      case "school_bus":
        return "bg-yellow-500"
      case "city_bus":
        return "bg-blue-500"
      case "normal":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const vehicleTypes = [
    { key: "ambulance", label: "Ambulances" },
    { key: "fire", label: "Fire Trucks" },
    { key: "school_bus", label: "School Buses" },
    { key: "city_bus", label: "City Buses" },
    { key: "normal", label: "Vehicles" },
  ] as const

  return (
    <Card className="absolute top-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Vehicle Layers</h3>
        <div className="space-y-3">
          {vehicleTypes.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getVehicleColor(key)}`} />
                {getVehicleIcon(key)}
                <span className="text-sm font-medium">{label}</span>
                <Badge variant="secondary" className="text-xs">
                  {getVehicleCount(key)}
                </Badge>
              </div>
              <Switch checked={visibleLayers[key]} onCheckedChange={(checked) => onLayerToggle(key, checked)} />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t text-xs text-gray-500">
          <p>Right-click on map to report incidents</p>
          <p>Click vehicles for details</p>
        </div>
      </CardContent>
    </Card>
  )
}
