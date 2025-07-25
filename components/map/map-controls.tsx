"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Ambulance, Truck, Bus, Car, AlertTriangle, Eye, EyeOff } from "lucide-react"

interface MapControlsProps {
  onLayerToggle: (layerType: string) => void
  activeLayer: string
  onActiveLayerChange: (layer: string) => void
}

export function MapControls({ onLayerToggle, activeLayer, onActiveLayerChange }: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const layers = [
    { id: "ambulance", name: "Ambulances", icon: Ambulance, color: "bg-red-500", count: 3 },
    { id: "fire", name: "Fire Trucks", icon: Truck, color: "bg-orange-500", count: 2 },
    { id: "school_bus", name: "School Buses", icon: Bus, color: "bg-yellow-500", count: 12 },
    { id: "city_bus", name: "City Buses", icon: Bus, color: "bg-blue-500", count: 8 },
    { id: "normal", name: "Vehicles", icon: Car, color: "bg-gray-500", count: 45 },
    { id: "incidents", name: "Incidents", icon: AlertTriangle, color: "bg-red-600", count: 5 },
  ]

  return (
    <Card className="absolute top-4 right-4 p-4 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5" />
          <span className="font-semibold">Map Layers</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {layers.map((layer) => {
            const IconComponent = layer.icon
            return (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => onLayerToggle(layer.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${layer.color}`} />
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm font-medium">{layer.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {layer.count}
                </Badge>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="text-xs bg-transparent">
            Emergency Mode
          </Button>
          <Button size="sm" variant="outline" className="text-xs bg-transparent">
            Traffic View
          </Button>
        </div>
      </div>
    </Card>
  )
}
