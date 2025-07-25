"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, RotateCcw, Route, Heart, Flame, Bus, Car, MapPin, Target, Crosshair } from "lucide-react"

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
  onLayerToggle: (layer: keyof typeof visibleLayers, visible: boolean) => void
  onResetView: () => void
  showRoutes: boolean
  onToggleRoutes: () => void
  userLocation?: UserLocation | null
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
  const getVehicleCount = (type: keyof typeof visibleLayers) => {
    return vehicles.filter((v) => v.type === type).length
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "ambulance":
        return <Heart className="w-4 h-4 text-red-500" />
      case "fire":
        return <Flame className="w-4 h-4 text-orange-500" />
      case "school_bus":
      case "city_bus":
        return <Bus className="w-4 h-4 text-blue-500" />
      case "normal":
        return <Car className="w-4 h-4 text-gray-500" />
      default:
        return <Car className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <Card className="absolute bottom-4 left-4 w-80 shadow-lg z-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <span>Map Controls</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Location Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Your Location</span>
            <div className={`w-3 h-3 rounded-full ${isTrackingUser ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          </div>

          {userLocation && (
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                Coordinates: {userLocation.coordinates[1].toFixed(4)}, {userLocation.coordinates[0].toFixed(4)}
              </div>
              <div>Accuracy: ±{Math.round(userLocation.accuracy)}m</div>
              {userLocation.speed && <div>Speed: {Math.round(userLocation.speed * 3.6)} km/h</div>}
              <div>Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isTrackingUser ? "destructive" : "default"}
              size="sm"
              onClick={isTrackingUser ? onStopTracking : onStartTracking}
              className="flex items-center space-x-1"
            >
              <Crosshair className="w-3 h-3" />
              <span>{isTrackingUser ? "Stop" : "Track"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onCenterOnUser}
              disabled={!userLocation}
              className="flex items-center space-x-1 bg-transparent"
            >
              <Target className="w-3 h-3" />
              <span>Center</span>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-Center</span>
            <Switch checked={autoCenter} onCheckedChange={onToggleAutoCenter} disabled={!userLocation} />
          </div>
        </div>

        <Separator />

        {/* Vehicle Layer Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Vehicle Layers</span>
            <Badge variant="outline">{vehicles.length} total</Badge>
          </div>

          <div className="space-y-2">
            {Object.entries(visibleLayers).map(([type, visible]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getVehicleIcon(type)}
                  <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                  <Badge variant="secondary" className="text-xs">
                    {getVehicleCount(type as keyof typeof visibleLayers)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLayerToggle(type as keyof typeof visibleLayers, !visible)}
                >
                  {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Route Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Routes</span>
            <Badge variant={showRoutes ? "default" : "outline"}>{showRoutes ? "ON" : "OFF"}</Badge>
          </div>

          <Button
            variant={showRoutes ? "destructive" : "default"}
            size="sm"
            onClick={onToggleRoutes}
            className="w-full flex items-center space-x-2"
          >
            <Route className="w-4 h-4" />
            <span>{showRoutes ? "Hide Routes" : "Show Routes"}</span>
          </Button>
        </div>

        <Separator />

        {/* Map Controls */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetView}
            className="w-full flex items-center space-x-2 bg-transparent"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset View</span>
          </Button>
        </div>

        {/* Status Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Right-click to report incidents</p>
          <p>• Click vehicles for details</p>
          {userLocation && <p>• Your location is being tracked</p>}
        </div>
      </CardContent>
    </Card>
  )
}
