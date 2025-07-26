"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Car, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX
} from "lucide-react"

interface NavigationStep {
  instruction: string
  distance: number
  duration: number
  maneuver: {
    type: string
    instruction: string
    bearing_before: number
    bearing_after: number
  }
  road_name?: string
  speed_limit?: number
  traffic_light?: boolean
  emergency_access?: boolean
}

interface NavigationRoute {
  id: string
  distance: number
  duration: number
  traffic_delay: number
  geometry: {
    type: "LineString"
    coordinates: [number, number][]
  }
  legs: {
    distance: number
    duration: number
    steps: NavigationStep[]
    traffic_conditions: any[]
  }[]
  summary: {
    total_distance: number
    total_duration: number
    traffic_delay: number
    fuel_consumption?: number
    co2_emissions?: number
    road_types: string[]
    traffic_signals: number
    emergency_priorities: number
  }
  emergency_priority: boolean
  traffic_conditions: any[]
}

interface NavigationServiceProps {
  route?: NavigationRoute
  onStartNavigation?: () => void
  onStopNavigation?: () => void
  onRouteUpdate?: (route: NavigationRoute) => void
  isNavigating?: boolean
  currentStep?: number
  userLocation?: [number, number]
}

export function NavigationService({ 
  route, 
  onStartNavigation, 
  onStopNavigation, 
  onRouteUpdate,
  isNavigating = false,
  currentStep = 0,
  userLocation
}: NavigationServiceProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [autoReroute, setAutoReroute] = useState(true)
  const [showTrafficAlerts, setShowTrafficAlerts] = useState(true)
  const [navigationProgress, setNavigationProgress] = useState(0)

  // Calculate navigation progress
  useEffect(() => {
    if (route && currentStep > 0) {
      const totalSteps = route.legs[0]?.steps?.length || 1
      const progress = (currentStep / totalSteps) * 100
      setNavigationProgress(Math.min(progress, 100))
    }
  }, [route, currentStep])

  // Voice navigation announcements
  const announceStep = useCallback((step: NavigationStep) => {
    if (isMuted) return
    
    const utterance = new SpeechSynthesisUtterance(step.instruction)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    speechSynthesis.speak(utterance)
  }, [isMuted])

  // Auto-announce when step changes
  useEffect(() => {
    if (isNavigating && route && currentStep > 0) {
      const currentStepData = route.legs[0]?.steps?.[currentStep - 1]
      if (currentStepData) {
        announceStep(currentStepData)
      }
    }
  }, [currentStep, route, isNavigating, announceStep])

  // Traffic alert detection
  const detectTrafficAlerts = useCallback(() => {
    if (!route || !showTrafficAlerts) return []
    
    const alerts: Array<{
      type: string
      message: string
      severity: "high" | "medium" | "low"
    }> = []
    const trafficConditions = route.traffic_conditions || []
    
    trafficConditions.forEach((condition, index) => {
      if (condition.congestion_level > 0.7) {
        alerts.push({
          type: "congestion",
          message: `Heavy traffic ahead at step ${index + 1}`,
          severity: "high"
        })
      }
      
      if (condition.road_works) {
        alerts.push({
          type: "road_works",
          message: `Road works detected at step ${index + 1}`,
          severity: "medium"
        })
      }
      
      if (condition.incidents?.length > 0) {
        alerts.push({
          type: "incident",
          message: `Traffic incident reported at step ${index + 1}`,
          severity: "high"
        })
      }
    })
    
    return alerts
  }, [route, showTrafficAlerts])

  const trafficAlerts = detectTrafficAlerts()

  if (!route) {
    return (
      <Card className="w-80 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Navigation className="w-5 h-5 mr-2" />
            Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No route selected</p>
            <p className="text-sm">Click on a destination to start navigation</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStepData = route.legs[0]?.steps?.[currentStep - 1]
  const totalSteps = route.legs[0]?.steps?.length || 0
  const remainingDistance = route.legs[0]?.steps
    ?.slice(currentStep)
    ?.reduce((total, step) => total + step.distance, 0) || 0

  return (
    <Card className="w-80 bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Navigation className="w-5 h-5 mr-2" />
            Navigation
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            {isNavigating ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopNavigation}
              >
                <Pause className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onStartNavigation}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Route Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Distance</span>
            <span className="font-medium">{(route.distance / 1000).toFixed(1)} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Duration</span>
            <span className="font-medium">{Math.round(route.duration / 60)} min</span>
          </div>
          {route.traffic_delay > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Traffic Delay</span>
              <span className="font-medium">+{Math.round(route.traffic_delay / 60)} min</span>
            </div>
          )}
        </div>

        {/* Navigation Progress */}
        {isNavigating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{Math.round(navigationProgress)}%</span>
            </div>
            <Progress value={navigationProgress} className="w-full" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Remaining</span>
              <span>{(remainingDistance / 1000).toFixed(1)} km</span>
            </div>
          </div>
        )}

        {/* Current Step */}
        {isNavigating && currentStepData && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="font-medium text-sm">{currentStepData.instruction}</p>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{currentStepData.distance}m</span>
                  <span>{Math.round(currentStepData.duration)}s</span>
                </div>
                {currentStepData.road_name && (
                  <p className="text-xs text-gray-500 mt-1">{currentStepData.road_name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Traffic Alerts */}
        {trafficAlerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Traffic Alerts</span>
            </div>
            {trafficAlerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-orange-50 rounded">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">{alert.message}</p>
                  <Badge 
                    variant={alert.severity === "high" ? "destructive" : "secondary"}
                    className="text-xs mt-1"
                  >
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Optimizations */}
        {route.emergency_priority && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">Emergency Route Active</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Traffic signals coordinated • Emergency lane access granted
            </div>
          </div>
        )}

        {/* Route Statistics */}
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Traffic Signals</span>
            <span>{route.summary.traffic_signals}</span>
          </div>
          <div className="flex justify-between">
            <span>Emergency Priorities</span>
            <span>{route.summary.emergency_priorities}</span>
          </div>
          {route.summary.fuel_consumption && (
            <div className="flex justify-between">
              <span>Fuel Consumption</span>
              <span>{route.summary.fuel_consumption.toFixed(2)} L</span>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setAutoReroute(!autoReroute)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            {autoReroute ? "Auto-reroute ON" : "Auto-reroute OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowTrafficAlerts(!showTrafficAlerts)}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            {showTrafficAlerts ? "Alerts ON" : "Alerts OFF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 