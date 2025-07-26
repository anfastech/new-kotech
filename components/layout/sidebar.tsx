"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSocket } from "@/components/providers/socket-provider"
import { BarChart3, AlertTriangle, Users, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useSettings } from "@/components/providers/settings-provider"
import { GPSTrackingDialog } from "@/components/gps-tracking-dialog"
import { TrafficInfoDialog } from "@/components/traffic-info-dialog"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { connectionStatus } = useSocket()
  const { openSettings } = useSettings()

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-50 border-r border-gray-200 p-4">
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)} className="w-full">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Control Panel</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Connection:</span>
                <Badge variant={connectionStatus === "connected" ? "default" : "secondary"}>{connectionStatus}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Vehicles:</span>
                <Badge variant="outline">5</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Incidents:</span>
                <Badge variant="outline">0</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/analytics" className="block">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Alert
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent" onClick={openSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Map Settings & Controls
              </Button>
              <GPSTrackingDialog />
              <TrafficInfoDialog />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 text-center py-4">No recent alerts</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
