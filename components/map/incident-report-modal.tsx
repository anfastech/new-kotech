"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, MapPin, AlertTriangle, Navigation, Target } from "lucide-react"

interface UserLocation {
  coordinates: [number, number]
  accuracy: number
  heading?: number
  speed?: number
  timestamp: number
}

interface IncidentReportModalProps {
  location: [number, number]
  onSubmit: (incident: {
    type: string
    coordinates: [number, number]
    description: string
    severity: string
    reportedBy: string
  }) => void
  onClose: () => void
  userLocation?: UserLocation | null
}

export function IncidentReportModal({ location, onSubmit, onClose, userLocation }: IncidentReportModalProps) {
  const [incidentType, setIncidentType] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("")
  const [reporterName, setReporterName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculateDistance = () => {
    if (!userLocation) return null

    const R = 6371 // Earth's radius in kilometers
    const dLat = ((location[1] - userLocation.coordinates[1]) * Math.PI) / 180
    const dLon = ((location[0] - userLocation.coordinates[0]) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.coordinates[1] * Math.PI) / 180) *
        Math.cos((location[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!incidentType || !description || !severity) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        type: incidentType,
        coordinates: location,
        description,
        severity,
        reportedBy: reporterName || "Anonymous",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const incidentTypes = [
    { value: "accident", label: "🚗 Traffic Accident", color: "bg-red-100 text-red-800" },
    { value: "breakdown", label: "🔧 Vehicle Breakdown", color: "bg-yellow-100 text-yellow-800" },
    { value: "congestion", label: "🚦 Traffic Congestion", color: "bg-orange-100 text-orange-800" },
    { value: "roadwork", label: "🚧 Road Construction", color: "bg-blue-100 text-blue-800" },
    { value: "weather", label: "🌧️ Weather Hazard", color: "bg-gray-100 text-gray-800" },
    { value: "emergency", label: "🚨 Emergency Situation", color: "bg-red-100 text-red-800" },
    { value: "other", label: "📋 Other Issue", color: "bg-purple-100 text-purple-800" },
  ]

  const severityLevels = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Report Incident</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Location Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-sm text-blue-800">Incident Location</span>
            </div>

            <div className="text-xs text-blue-700 space-y-1">
              <div>
                Coordinates: {location[1].toFixed(6)}, {location[0].toFixed(6)}
              </div>
              {userLocation && (
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>Distance from you: {calculateDistance()}</span>
                </div>
              )}
              <div>📍 Within Malappuram District</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs bg-transparent"
              onClick={() => {
                const url = `https://www.google.com/maps?q=${location[1]},${location[0]}`
                window.open(url, "_blank")
              }}
            >
              <Navigation className="w-3 h-3 mr-1" />
              View in Google Maps
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Incident Type */}
            <div className="space-y-2">
              <Label htmlFor="incident-type">Incident Type *</Label>
              <Select value={incidentType} onValueChange={setIncidentType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {incidentType && (
                <Badge className={incidentTypes.find((t) => t.value === incidentType)?.color}>
                  {incidentTypes.find((t) => t.value === incidentType)?.label}
                </Badge>
              )}
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Severity Level *</Label>
              <Select value={severity} onValueChange={setSeverity} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {severity && (
                <Badge className={severityLevels.find((s) => s.value === severity)?.color}>
                  {severityLevels.find((s) => s.value === severity)?.label} Priority
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-gray-500">{description.length}/500 characters</div>
            </div>

            {/* Reporter Name */}
            <div className="space-y-2">
              <Label htmlFor="reporter">Your Name (Optional)</Label>
              <Input
                id="reporter"
                placeholder="Enter your name or leave blank for anonymous"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>

            {/* Emergency Contact Info */}
            {(incidentType === "accident" || incidentType === "emergency") && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm font-medium text-red-800 mb-2">Emergency Contacts</div>
                <div className="text-xs text-red-700 space-y-1">
                  <div>🚨 Police: 100</div>
                  <div>🚑 Ambulance: 108</div>
                  <div>🚒 Fire: 101</div>
                  <div>📞 Emergency: 112</div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-transparent"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!incidentType || !description || !severity || isSubmitting}
              >
                {isSubmitting ? "Reporting..." : "Report Incident"}
              </Button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
            <p>• Your report will be sent to traffic authorities</p>
            <p>• Emergency services will be notified for critical incidents</p>
            {userLocation && <p>• Your location is being used for accurate reporting</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
