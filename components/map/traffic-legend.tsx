"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export function TrafficLegend() {
  const trafficLevels = [
    { level: "Low", color: "bg-green-500", description: "Free flow", icon: CheckCircle },
    { level: "Medium", color: "bg-yellow-500", description: "Moderate", icon: Activity },
    { level: "High", color: "bg-orange-500", description: "Congested", icon: AlertTriangle },
    { level: "Critical", color: "bg-red-500", description: "Blocked", icon: XCircle },
  ]

  return (
    <div className="absolute bottom-4 right-4">
      <Card className="p-3 bg-white/95 backdrop-blur-sm">
        <div className="text-sm font-semibold mb-2">Traffic Levels</div>
        <div className="space-y-2">
          {trafficLevels.map((level) => {
            const IconComponent = level.icon
            return (
              <div key={level.level} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-full ${level.color}`} />
                <IconComponent className="w-3 h-3 text-gray-500" />
                <span className="font-medium">{level.level}</span>
                <span className="text-gray-600">{level.description}</span>
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Active Incidents:</span>
              <Badge variant="secondary" className="text-xs">
                5
              </Badge>
            </div>
            <div className="flex justify-between mt-1">
              <span>Avg Speed:</span>
              <span className="font-medium">45 km/h</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
