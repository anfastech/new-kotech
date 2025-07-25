"use client"

import { Card } from "@/components/ui/card"

export function TrafficLegend() {
  return (
    <Card className="absolute bottom-4 right-4 p-3 bg-white/95 backdrop-blur-sm">
      <h4 className="font-semibold text-sm mb-2">Traffic Conditions</h4>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-green-500 rounded" />
          <span className="text-xs">Free Flow</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-yellow-500 rounded" />
          <span className="text-xs">Moderate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-orange-500 rounded" />
          <span className="text-xs">Heavy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-2 bg-red-500 rounded" />
          <span className="text-xs">Congested</span>
        </div>
      </div>
    </Card>
  )
}
