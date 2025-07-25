"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, AlertTriangle, Car, Construction, MapPin } from "lucide-react"

interface IncidentReportModalProps {
  location: [number, number] | null
  onSubmit: (data: any) => void
  onClose: () => void
}

export function IncidentReportModal({ location, onSubmit, onClose }: IncidentReportModalProps) {
  const [incidentType, setIncidentType] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("")

  const incidentTypes = [
    { value: "accident", label: "Traffic Accident", icon: Car },
    { value: "congestion", label: "Traffic Congestion", icon: AlertTriangle },
    { value: "roadblock", label: "Road Block", icon: Construction },
    { value: "construction", label: "Construction Work", icon: Construction },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentType || !description) return

    onSubmit({
      type: incidentType,
      description,
      severity,
      location,
    })
  }

  if (!location) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Report Incident</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>
            Location: {location[1].toFixed(4)}, {location[0].toFixed(4)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Incident Type</label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Severity</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor disruption</SelectItem>
                <SelectItem value="medium">Medium - Moderate impact</SelectItem>
                <SelectItem value="high">High - Major disruption</SelectItem>
                <SelectItem value="critical">Critical - Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident..."
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={!incidentType || !description}>
              Report Incident
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
