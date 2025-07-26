"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crosshair, Target, MapPin, Navigation, Route, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { useMap } from "@/components/providers/map-provider"

export function GPSTrackingDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [showDestinationSelector, setShowDestinationSelector] = useState(false)
  
  const {
    userLocation,
    isTrackingUser,
    onStartTracking,
    onStopTracking,
    onCenterOnUser,
    onToggleAutoCenter,
    onToggleRoutes,
    onResetView,
    setMapFunctions
  } = useMap()

  const kottakkalDestinations = {
    "kottakkal-temple": {
      name: "Kottakkal Temple",
      coordinates: [75.9988, 11.0001] as [number, number],
      icon: "🕍"
    },
    "custom-point": {
      name: "Custom Point",
      coordinates: [75.994819, 11.006126] as [number, number],
      icon: "📍"
    },
    "new-bus-stand": {
      name: "New Bus Stand",
      coordinates: [76.0047806, 11.0017263] as [number, number],
      icon: "🚌"
    }
  }

  const navigateToDestination = (destinationKey: string) => {
    const destination = kottakkalDestinations[destinationKey as keyof typeof kottakkalDestinations]
    if (destination && userLocation) {
      console.log(`Navigating to ${destination.name}...`)
      // Dispatch custom event for map component to handle
      const event = new CustomEvent('navigate-to-destination', {
        detail: { destination, userLocation }
      })
      window.dispatchEvent(event)
    }
  }

  const navigateBetweenPoints = (fromKey: string, toKey: string) => {
    const from = kottakkalDestinations[fromKey as keyof typeof kottakkalDestinations]
    const to = kottakkalDestinations[toKey as keyof typeof kottakkalDestinations]
    if (from && to) {
      console.log(`Navigating from ${from.name} to ${to.name}...`)
      // Dispatch custom event for map component to handle
      const event = new CustomEvent('navigate-between-points', {
        detail: { from, to }
      })
      window.dispatchEvent(event)
    }
  }

  const clearRoute = () => {
    console.log("Clearing route...")
    // Dispatch custom event for map component to handle
    const event = new CustomEvent('clear-route')
    window.dispatchEvent(event)
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full justify-start bg-transparent" 
        onClick={() => setIsOpen(true)}
      >
        <Crosshair className="w-4 h-4 mr-2" />
        GPS Tracking Active
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center space-x-2">
              <Crosshair className="w-5 h-5" />
              <span>GPS Tracking & Navigation</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* GPS Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">📍 GPS Tracking</span>
                <div className={`w-3 h-3 rounded-full ${isTrackingUser ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>

              {/* API Status */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800 font-medium">🔄 Location API Active</div>
                <div className="text-xs text-blue-600">Fetching location every 3 seconds</div>
              </div>

              {/* GPS Status Banner */}
              {!userLocation && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 font-medium">📍 GPS Required for Navigation</div>
                  <div className="text-xs text-yellow-600">Enable GPS tracking to start navigating</div>
                </div>
              )}

              {userLocation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-800 font-medium">✅ GPS Active - Ready to Navigate</div>
                  <div className="text-xs text-green-600">
                    Your location: {userLocation.coordinates[1].toFixed(4)}, {userLocation.coordinates[0].toFixed(4)}
                  </div>
                </div>
              )}

              {/* GPS Controls */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={isTrackingUser ? "destructive" : "default"}
                  size="sm"
                  onClick={isTrackingUser ? onStopTracking : onStartTracking}
                  className="flex items-center space-x-1"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{isTrackingUser ? "Stop GPS" : "Start GPS"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCenterOnUser}
                  disabled={!userLocation}
                  className="flex items-center space-x-1"
                >
                  <Target className="w-3 h-3" />
                  <span>Center</span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Current Location Details */}
            {userLocation && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">📍 Your Current Location</h3>
                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg space-y-1">
                  <div><strong>Latitude:</strong> {userLocation.coordinates[1].toFixed(6)}</div>
                  <div><strong>Longitude:</strong> {userLocation.coordinates[0].toFixed(6)}</div>
                  <div><strong>Accuracy:</strong> ±{Math.round(userLocation.accuracy)}m</div>
                  {userLocation.speed && (
                    <div><strong>Speed:</strong> {Math.round(userLocation.speed * 3.6)} km/h</div>
                  )}
                  <div><strong>Updated:</strong> {new Date(userLocation.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            <Separator />

            {/* Navigation Options */}
            {userLocation && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">🗺️ Navigation Options</h3>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDestinationSelector(!showDestinationSelector)}
                    className="flex items-center space-x-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Choose Destination</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToDestination("kottakkal-temple")}
                    className="flex items-center space-x-1"
                  >
                    <span>🕍</span>
                    <span>To Temple</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToDestination("custom-point")}
                    className="flex items-center space-x-1"
                  >
                    <span>📍</span>
                    <span>To Custom Point</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToDestination("new-bus-stand")}
                    className="flex items-center space-x-1"
                  >
                    <span>🚌</span>
                    <span>To New Bus Stand</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateBetweenPoints("custom-point", "new-bus-stand")}
                    className="flex items-center space-x-1"
                  >
                    <Route className="w-3 h-3" />
                    <span>Custom Point → Bus Stand</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearRoute}
                    className="flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Route</span>
                  </Button>
                </div>

                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-1">How to navigate:</div>
                  <div>1. Enable GPS tracking above</div>
                  <div>2. Click "Choose Destination"</div>
                  <div>3. Select your destination</div>
                  <div>4. Follow the blue route line</div>
                </div>
              </div>
            )}

            <Separator />

            {/* Map Controls */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">🗺️ Map Controls</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-center on location</span>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show routes</span>
                  <Switch />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onResetView}
                className="w-full flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Map View</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 