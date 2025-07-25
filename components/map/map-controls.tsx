"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Car, Bus, Heart, Flame, Eye, EyeOff } from "lucide-react"

interface MapControlsProps {
  onLayerToggle: (layerType: string) => void
  activeLayer: string
  onActiveLayerChange: (layer: string) => void
}

export function MapControls({ onLayerToggle, activeLayer, onActiveLayerChange }: MapControlsProps) {
  const vehicleTypes = [
    { id: "ambulance", label: "Ambulances", icon: Heart, color: "text-red-500", count: 3 },
    { id: "fire", label: "Fire Trucks", icon: Flame, color: "text-orange-500", count: 2 },
    { id: "school_bus", label: "School Buses", icon: Bus, color: "text-yellow-500", count: 12 },
    { id: "city_bus", label: "City Buses", icon: Bus, color: "text-blue-500", count: 8 },
    { id: "normal", label: "Vehicles", icon: Car, color: "text-green-500", count: 43 },
  ]

  return (
    <div className="absolute top-4 right-4 space-y-2">
      <Card className="p-4 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4" />
          <span className="font-semibold text-sm">Map Layers</span>
        </div>

        <div className="space-y-2">
          {vehicleTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <div key={type.id} className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLayerToggle(type.id)}
                  className="flex items-center gap-2 h-8 px-2"
                >
                  <IconComponent className={`w-4 h-4 ${type.color}`} />
                  <span className="text-xs">{type.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {type.count}
                  </Badge>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onLayerToggle(type.id)} className="h-6 w-6 p-0">
                  {activeLayer === type.id ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-3 bg-white/95 backdrop-blur-sm">
        <div className="text-xs text-gray-600">
          <div className="font-semibold mb-1">Quick Actions</div>
          <div>Right-click to report incident</div>
          <div>Click vehicle for details</div>
        </div>
      </Card>
    </div>
  )
}
