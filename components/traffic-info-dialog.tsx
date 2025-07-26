"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Car, Route, AlertTriangle, Info, Activity } from "lucide-react"
import { useState } from "react"

const trafficLevels = [
  {
    level: "Low Traffic",
    description: "Smooth flow, no delays",
    color: "bg-green-500"
  },
  {
    level: "Moderate Traffic",
    description: "Some congestion, minor delays",
    color: "bg-yellow-500"
  },
  {
    level: "Heavy Traffic",
    description: "Significant delays expected",
    color: "bg-orange-500"
  },
  {
    level: "Severe Traffic",
    description: "Major congestion, avoid if possible",
    color: "bg-red-500"
  }
]

const routeTypes = [
  {
    type: "User Route",
    description: "Your navigation path",
    color: "bg-blue-500"
  },
  {
    type: "Ambulance Route",
    description: "Emergency vehicle path",
    color: "bg-red-500"
  },
  {
    type: "Police Route",
    description: "Law enforcement path",
    color: "bg-blue-600"
  },
  {
    type: "Bus Route",
    description: "Public transport path",
    color: "bg-green-600"
  }
]

const trafficAlerts = [
  {
    type: "Accident",
    location: "NH 66 near Kottakkal",
    severity: "High",
    time: "2 minutes ago"
  },
  {
    type: "Road Work",
    location: "Malappuram-Kozhikode Highway",
    severity: "Medium",
    time: "15 minutes ago"
  },
  {
    type: "Traffic Signal",
    location: "Kottakkal Junction",
    severity: "Low",
    time: "5 minutes ago"
  }
]

export function TrafficInfoDialog() {
  const [isOpen, setIsOpen] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full justify-start bg-transparent" 
        onClick={() => setIsOpen(true)}
      >
        <Activity className="w-4 h-4 mr-2" />
        Malappuram Traffic Info
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Malappuram Traffic Information</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Traffic Levels */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Car className="w-4 h-4" />
                <span>Traffic Levels</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trafficLevels.map((level) => (
                  <div key={level.level} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-4 h-4 rounded-full ${level.color}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{level.level}</div>
                      <div className="text-xs text-gray-500">{level.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Types */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Route className="w-4 h-4" />
                <span>Route Types</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {routeTypes.map((route) => (
                  <div key={route.type} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-4 h-4 rounded-full ${route.color}`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{route.type}</div>
                      <div className="text-xs text-gray-500">{route.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Traffic Alerts */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Live Traffic Alerts</span>
              </h3>
              <div className="space-y-2">
                {trafficAlerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium">{alert.type}</div>
                        <div className={`px-2 py-1 text-xs rounded-full ${
                          alert.severity === 'High' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.severity}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{alert.time}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{alert.location}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Statistics */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Traffic Statistics</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">85%</div>
                  <div className="text-xs text-gray-600">Flow Rate</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">12</div>
                  <div className="text-xs text-gray-600">Active Routes</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">3</div>
                  <div className="text-xs text-gray-600">Alerts</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">24</div>
                  <div className="text-xs text-gray-600">Cameras</div>
                </div>
              </div>
            </div>

            {/* District Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">District Information</h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Coverage Area:</strong> Malappuram District, Kerala</p>
                  <p><strong>Major Roads:</strong> NH 66, NH 966, State Highways</p>
                  <p><strong>Key Cities:</strong> Kottakkal, Malappuram, Manjeri, Perinthalmanna</p>
                  <p><strong>Update Frequency:</strong> Real-time (every 30 seconds)</p>
                  <p><strong>Data Source:</strong> Traffic cameras, GPS tracking, user reports</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500 text-center">
                <p>Real-time traffic monitoring in Malappuram district</p>
                <p>Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 