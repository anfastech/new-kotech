"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const trafficData = [
  { time: "06:00", vehicles: 120, congestion: 0.2 },
  { time: "07:00", vehicles: 280, congestion: 0.6 },
  { time: "08:00", vehicles: 450, congestion: 0.8 },
  { time: "09:00", vehicles: 380, congestion: 0.7 },
  { time: "10:00", vehicles: 220, congestion: 0.4 },
  { time: "11:00", vehicles: 180, congestion: 0.3 },
  { time: "12:00", vehicles: 320, congestion: 0.5 },
]

const vehicleTypes = [
  { name: "Normal Vehicles", value: 45, color: "#8884d8" },
  { name: "School Buses", value: 12, color: "#82ca9d" },
  { name: "City Buses", value: 8, color: "#ffc658" },
  { name: "Emergency", value: 5, color: "#ff7300" },
]

const incidentData = [
  { type: "Accidents", count: 12, trend: "+2" },
  { type: "Congestion", count: 28, trend: "-5" },
  { type: "Road Blocks", count: 6, trend: "+1" },
  { type: "Construction", count: 4, trend: "0" },
]

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Traffic Analytics</h1>
        <Badge variant="outline">Last updated: 2 min ago</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Vehicles</h3>
          <p className="text-2xl font-bold">68</p>
          <p className="text-xs text-green-600">+12% from yesterday</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Incidents</h3>
          <p className="text-2xl font-bold">5</p>
          <p className="text-xs text-red-600">+2 from last hour</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Avg Speed</h3>
          <p className="text-2xl font-bold">32 km/h</p>
          <p className="text-xs text-yellow-600">-8% from normal</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Emergency Response</h3>
          <p className="text-2xl font-bold">4.2 min</p>
          <p className="text-xs text-green-600">-15% improvement</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Traffic Flow Today</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="vehicles" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Vehicle Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vehicleTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {vehicleTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Incident Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {incidentData.map((incident, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{incident.type}</h4>
                <Badge
                  variant={
                    incident.trend.startsWith("+")
                      ? "destructive"
                      : incident.trend.startsWith("-")
                        ? "default"
                        : "secondary"
                  }
                >
                  {incident.trend}
                </Badge>
              </div>
              <p className="text-2xl font-bold">{incident.count}</p>
              <p className="text-sm text-gray-500">This week</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
