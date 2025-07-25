"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TrafficLegend() {
  const trafficLevels = [
    { level: "Low", color: "bg-green-500", description: "Free flowing traffic" },
    { level: "Moderate", color: "bg-yellow-500", description: "Some congestion" },
    { level: "Heavy", color: "bg-orange-500", description: "Slow moving traffic" },
    { level: "Severe", color: "bg-red-500", description: "Traffic jam" },
  ]

  return (
    <Card className="absolute bottom-4 left-4 w-64 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Traffic Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {trafficLevels.map((level) => (
          <div key={level.level} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${level.color}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{level.level}</div>
              <div className="text-xs text-gray-500">{level.description}</div>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t text-xs text-gray-500">
          <p>Real-time traffic monitoring</p>
        </div>
      </CardContent>
    </Card>
  )
}
