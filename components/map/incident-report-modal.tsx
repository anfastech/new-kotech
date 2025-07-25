"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Car, Construction, Zap } from "lucide-react"

interface Incident {
  type: string
  coordinates: [number, number]
  description: string
}

interface IncidentReportModalProps {
  location: [number, number]
  onSubmit: (incident: Incident) => void
  onClose: () => void
}

export function IncidentReportModal({ location, onSubmit, onClose }: IncidentReportModalProps) {
  const [incidentType, setIncidentType] = useState("")
  const [description, setDescription] = useState("")

  const incidentTypes = [
    { value: "accident", label: "Traffic Accident", icon: <Car className="w-4 h-4" /> },
    { value: "congestion", label: "Traffic Congestion", icon: <AlertTriangle className="w-4 h-4" /> },
    { value: "roadwork", label: "Road Work", icon: <Construction className="w-4 h-4" /> },
    { value: "breakdown", label: "Vehicle Breakdown", icon: <Car className="w-4 h-4" /> },
    { value: "hazard", label: "Road Hazard", icon: <Zap className="w-4 h-4" /> },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentType) return

    onSubmit({
      type: incidentType,
      coordinates: location,
      description: description.trim() || `${incidentType} reported at location`,
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="incident-type">Incident Type</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={`${location[1].toFixed(4)}, ${location[0].toFixed(4)}`}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide additional details about the incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!incidentType}>
              Report Incident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
