"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, MapPin } from "lucide-react"

interface IncidentReportModalProps {
  location: [number, number] | null
  onSubmit: (data: any) => void
  onClose: () => void
}

export function IncidentReportModal({ location, onSubmit, onClose }: IncidentReportModalProps) {
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    severity: "medium",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.type && formData.description) {
      onSubmit(formData)
    }
  }

  if (!location) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Report Incident</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>
            {location[1].toFixed(4)}, {location[0].toFixed(4)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="incident-type">Incident Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accident">Traffic Accident</SelectItem>
                <SelectItem value="congestion">Heavy Congestion</SelectItem>
                <SelectItem value="roadblock">Road Block</SelectItem>
                <SelectItem value="construction">Construction Work</SelectItem>
                <SelectItem value="weather">Weather Related</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity">Severity Level</Label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor delay</SelectItem>
                <SelectItem value="medium">Medium - Moderate delay</SelectItem>
                <SelectItem value="high">High - Major disruption</SelectItem>
                <SelectItem value="critical">Critical - Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the incident..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Report Incident
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
