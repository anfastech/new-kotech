"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  Flame,
  Bus,
  Car,
  Eye,
  EyeOff,
  RotateCcw,
  Route,
  MapPin,
  Navigation,
  Target,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

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

interface MapControlsProps {
  vehicles: Vehicle[]
  visibleLayers: {
    ambulance: boolean
    fire: boolean
    school_bus: boolean
    city_bus: boolean
    normal: boolean
  }
  onLayerToggle: (layer: string, visible: boolean) => void
  onResetView: () => void
  showRoutes: boolean
  onToggleRoutes: () => void
  userLocation: UserLocation | null
  isTrackingUser: boolean
  onStartTracking: () => void
  onStopTracking: () => void
  onCenterOnUser: () => void
  autoCenter: boolean
  onToggleAutoCenter: () => void
}

export function MapControls({
  vehicles,
  visibleLayers,
  onLayerToggle,
  onResetView,
  showRoutes,
  onToggleRoutes,
  userLocation,
  isTrackingUser,
  onStartTracking,
  onStopTracking,
  onCenterOnUser,
  autoCenter,
  onToggleAutoCenter,
}: MapControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "ambulance":
        return <Heart className="w-4 h-4" />
      case "fire":
        return <Flame className="w-4 h-4" />
      case "school_bus":
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
        return "text-red-500"
      case "fire":
        return "text-orange-500"
      case "school_bus":
        return "text-yellow-500"
      case "city_bus":
        return "text-blue-500"
      case "normal":
        return "text-gray-500"
      default:
        return "text-gray-500"
    }
  }

  const getVehicleCount = (type: string) => {
    return vehicles.filter((v) => v.type === type).length
  }

  const getVehicleLabel = (type: string) => {
    switch (type) {
      case "ambulance":
        return "Ambulances"
      case "fire":
        return "Fire Trucks"
      case "school_bus":
        return "School Buses"
      case "city_bus":
        return "City Buses"
      case "normal":
        return "Vehicles"
      default:
        return "Vehicles"
    }
  }

  return (
    <Card className="absolute bottom-4 left-4 w-80 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Map Controls</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* User Location Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Your Location</h4>
                <div className={`w-2 h-2 rounded-full ${isTrackingUser ? "bg-green-500" : "bg-gray-400"}`} />
              </div>

              {userLocation && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {userLocation.coordinates[1].toFixed(4)}, {userLocation.coordinates[0].toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-3 h-3" />
                    <span>Accuracy: {Math.round(userLocation.accuracy)}m</span>
                  </div>
                  {userLocation.speed && (
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-3 h-3" />
                      <span>Speed: {Math.round(userLocation.speed * 3.6)} km/h</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={isTrackingUser ? "destructive" : "default"}
                  onClick={isTrackingUser ? onStopTracking : onStartTracking}
                  className="flex-1"
                >
                  {isTrackingUser ? "Stop Tracking" : "Start Tracking"}
                </Button>

                {userLocation && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCenterOnUser}
                      className="flex items-center space-x-1 bg-transparent"
                    >
                      <Target className="w-3 h-3" />
                      <span>Center</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onToggleAutoCenter}
                      className="flex items-center space-x-1 bg-transparent"
                    >
                      {autoCenter ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                      <span>Auto</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Vehicle Layer Controls */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Vehicle Layers</h4>
              <div className="space-y-2">
                {Object.entries(visibleLayers).map(([type, visible]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={getVehicleColor(type)}>{getVehicleIcon(type)}</div>
                      <span className="text-sm">{getVehicleLabel(type)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {getVehicleCount(type)}
                      </Badge>
                    </div>
                    <Switch checked={visible} onCheckedChange={(checked) => onLayerToggle(type, checked)} />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Map Actions */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Map Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleRoutes}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <Route className="w-3 h-3" />
                  <span>{showRoutes ? "Hide Routes" : "Show Routes"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResetView}
                  className="flex items-center space-x-1 bg-transparent"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset View</span>
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Right-click to report incidents</p>
              <p>• Click vehicles for details</p>
              <p>• Use location tracking for navigation</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
