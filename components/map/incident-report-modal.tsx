"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, AlertTriangle, Target } from "lucide-react"

interface UserLocation {
  coordinates: [number, number]
  accuracy: number
  heading?: number
  speed?: number
  timestamp: number
}

interface IncidentReportModalProps {
  location: [number, number]
  onSubmit: (incident: { type: string; coordinates: [number, number]; description: string }) => void
  onClose: () => void
  userLocation?: UserLocation | null
}

export function IncidentReportModal({ location, onSubmit, onClose, userLocation }: IncidentReportModalProps) {
  const [incidentType, setIncidentType] = useState("")
  const [description, setDescription] = useState("")
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

    if (!incidentType || !description.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        type: incidentType,
        coordinates: location,
        description: description.trim(),
      })
    } catch (error) {
      console.error("Error submitting incident:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const incidentTypes = [
    { value: "accident", label: "Traffic Accident", icon: "🚗" },
    { value: "congestion", label: "Traffic Congestion", icon: "🚦" },
    { value: "roadblock", label: "Road Block", icon: "🚧" },
    { value: "construction", label: "Construction Work", icon: "🏗️" },
    { value: "flooding", label: "Flooding", icon: "🌊" },
    { value: "breakdown", label: "Vehicle Breakdown", icon: "⚠️" },
    { value: "emergency", label: "Emergency Situation", icon: "🚨" },
    { value: "other", label: "Other", icon: "📍" },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Report Incident</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Info */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Incident Location</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Latitude: {location[1].toFixed(6)}</div>
              <div>Longitude: {location[0].toFixed(6)}</div>
              {userLocation && (
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>Distance from you: {calculateDistance()}</span>
                </div>
              )}
            </div>
          </div>

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
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">{description.length}/500 characters</div>
          </div>

          {/* Safety Notice */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Safety Notice:</p>
                <ul className="space-y-1">
                  <li>• Only report incidents you can see or are directly involved in</li>
                  <li>• For emergencies, call 108 (ambulance) or 101 (fire) immediately</li>
                  <li>• Do not use your phone while driving</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
            <Button type="submit" className="flex-1" disabled={!incidentType || !description.trim() || isSubmitting}>
              {isSubmitting ? "Reporting..." : "Report Incident"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
