"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Map, BarChart3, AlertTriangle, Route, Trophy, Settings, Users, Calendar, FileText } from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { icon: Map, label: "Live Map", active: true, badge: null },
    { icon: BarChart3, label: "Analytics", active: false, badge: null },
    { icon: AlertTriangle, label: "Incidents", active: false, badge: 5 },
    { icon: Route, label: "Routes", active: false, badge: null },
    { icon: Users, label: "Vehicles", active: false, badge: 68 },
    { icon: Trophy, label: "Leaderboard", active: false, badge: null },
    { icon: Calendar, label: "Schedule", active: false, badge: 3 },
    { icon: FileText, label: "Reports", active: false, badge: null },
    { icon: Settings, label: "Settings", active: false, badge: null },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={onClose} />

      <div className="relative w-80 h-full bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <Button
                  key={index}
                  variant={item.active ? "default" : "ghost"}
                  className="w-full justify-start"
                  size="sm"
                >
                  <IconComponent className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </nav>

        <div className="p-4 border-t">
          <Card className="p-3">
            <h3 className="font-semibold text-sm mb-2">System Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Active Vehicles:</span>
                <span className="font-medium">68</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency Units:</span>
                <span className="font-medium text-red-600">5</span>
              </div>
              <div className="flex justify-between">
                <span>Traffic Flow:</span>
                <span className="font-medium text-green-600">Good</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
