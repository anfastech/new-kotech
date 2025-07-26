"use client"

import { useRole } from "@/components/providers/role-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ambulance, Users, Shield, MapPin, Clock, AlertTriangle, CheckCircle } from "lucide-react"

export function RoleOverlay() {
  const { currentRole, user } = useRole()

  if (currentRole === "client") {
    return (
      <div className="fixed hidden top-4 left-4 z-40">
        <Card className="w-80 bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Client Mode</span>
              <Badge variant="secondary" className="text-xs">Public</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span>View traffic and navigation</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>Real-time updates</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Report incidents</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 pt-2 border-t">
              Switch to Driver Mode for emergency vehicle features
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentRole === "ambulance-driver") {
    return (
      <div className="fixed hidden top-4 left-4 z-40">
        <Card className="w-80 hidden bg-red-50/95 backdrop-blur-sm border-red-200 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Ambulance className="w-4 h-4 text-red-600" />
              <span>Ambulance Driver Mode</span>
              <Badge variant="destructive" className="text-xs">Emergency</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-red-700">
                <Shield className="w-3 h-3" />
                <span>Authenticated: {user?.username}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-red-700">
                <MapPin className="w-3 h-3" />
                <span>Emergency routing enabled</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-red-700">
                <CheckCircle className="w-3 h-3" />
                <span>Priority traffic access</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-red-700">
                <AlertTriangle className="w-3 h-3" />
                <span>Emergency alerts active</span>
              </div>
            </div>
            <div className="text-xs text-red-600 pt-2 border-t border-red-200">
              Emergency vehicle features unlocked
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
} 