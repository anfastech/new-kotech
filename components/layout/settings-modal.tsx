"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSettings } from "@/components/providers/settings-provider"
import { Button } from "@/components/ui/button"
import { Settings, MapPin, Crosshair, Target, Eye, EyeOff, Route, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface Vehicle {
  id: string
  type: "ambulance" | "fire" | "police" | "school_bus" | "city_bus" | "normal"
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

interface VisibleLayers {
  ambulance: boolean
  fire: boolean
  police: boolean
  school_bus: boolean
  city_bus: boolean
  normal: boolean
}

interface SettingsModalProps {
  vehicles: Vehicle[]
  visibleLayers: VisibleLayers
  onLayerToggle: (layer: keyof VisibleLayers, visible: boolean) => void
  userLocation: UserLocation | null
  isTrackingUser: boolean
  onStartTracking: () => void
  onStopTracking: () => void
  onCenterOnUser: () => void
  autoCenter: boolean
  onToggleAutoCenter: (checked: boolean) => void
  showRoutes: boolean
  onToggleRoutes: () => void
  onResetView: () => void
}

const getVehicleIcon = (type: string) => {
  switch (type) {
    case "ambulance":
      return <span className="text-red-500">🚑</span>
    case "fire":
      return <span className="text-orange-500">🚒</span>
    case "police":
      return <span className="text-blue-500">🚓</span>
    case "school_bus":
      return <span className="text-yellow-500">🚌</span>
    case "city_bus":
      return <span className="text-blue-600">🚌</span>
    case "normal":
      return <span className="text-gray-500">🚗</span>
    default:
      return <span className="text-gray-500">🚗</span>
  }
}

const getVehicleCount = (type: keyof VisibleLayers, vehicles: Vehicle[]) => {
  return vehicles.filter(v => v.type === type).length
}

export function SettingsModal({
  vehicles,
  visibleLayers,
  onLayerToggle,
  userLocation,
  isTrackingUser,
  onStartTracking,
  onStopTracking,
  onCenterOnUser,
  autoCenter,
  onToggleAutoCenter,
  showRoutes,
  onToggleRoutes,
  onResetView
}: SettingsModalProps) {
  const { isSettingsOpen, closeSettings } = useSettings()

  return (
    <Dialog open={isSettingsOpen} onOpenChange={closeSettings}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Map Settings & Controls</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Location Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">📍 Your Location</span>
              <div className={`w-3 h-3 rounded-full ${isTrackingUser ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
            </div>

            {userLocation && (
              <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                <div>
                  <strong>Coordinates:</strong> {userLocation.coordinates[1].toFixed(6)}, {userLocation.coordinates[0].toFixed(6)}
                </div>
                <div><strong>Accuracy:</strong> ±{Math.round(userLocation.accuracy)}m</div>
                {userLocation.speed && <div><strong>Speed:</strong> {Math.round(userLocation.speed * 3.6)} km/h</div>}
                <div><strong>Updated:</strong> {new Date(userLocation.timestamp).toLocaleTimeString()}</div>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">🚗 Vehicle Layers</span>
              <Badge variant="outline">{vehicles.length} total</Badge>
            </div>

            <div className="space-y-3">
              {Object.entries(visibleLayers).map(([type, visible]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {getVehicleIcon(type)}
                    <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getVehicleCount(type as keyof VisibleLayers, vehicles)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLayerToggle(type as keyof VisibleLayers, !visible)}
                  >
                    {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Route Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">🛣️ Routes</span>
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
          <div className="space-y-3">
            <span className="font-medium text-sm">🗺️ Map Controls</span>
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

          <Separator />

          {/* API Status */}
          <div className="space-y-3">
            <span className="font-medium text-sm">🔧 System Status</span>
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Location API Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Mapbox Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>

          {/* Help Info */}
          <div className="text-xs text-gray-500 space-y-1 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 mb-2">💡 Quick Tips:</p>
            <p>• Right-click on map to report incidents</p>
            <p>• Click vehicles for detailed information</p>
            <p>• Use GPS tracking for real-time location</p>
            <p>• Toggle layers to show/hide vehicle types</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 