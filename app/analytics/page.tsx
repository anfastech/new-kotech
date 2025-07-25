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
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Clock, Car } from "lucide-react"

const trafficData = [
  { time: "00:00", vehicles: 45, incidents: 2 },
  { time: "06:00", vehicles: 120, incidents: 5 },
  { time: "12:00", vehicles: 280, incidents: 8 },
  { time: "18:00", vehicles: 350, incidents: 12 },
  { time: "24:00", vehicles: 80, incidents: 3 },
]

const vehicleDistribution = [
  { name: "Normal Vehicles", value: 68, color: "#10b981" },
  { name: "City Buses", value: 12, color: "#3b82f6" },
  { name: "School Buses", value: 8, color: "#f59e0b" },
  { name: "Emergency", value: 5, color: "#ef4444" },
]

const incidentTypes = [
  { type: "Congestion", count: 15, trend: "up" },
  { type: "Accidents", count: 8, trend: "down" },
  { type: "Road Work", count: 5, trend: "up" },
  { type: "Weather", count: 2, trend: "down" },
]

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Traffic Analytics</h1>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <Badge variant="secondary">Live Data</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold">93</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">+12%</span>
            <span className="text-gray-500 ml-1">from yesterday</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Incidents</p>
              <p className="text-2xl font-bold">30</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-500">-5%</span>
            <span className="text-gray-500 ml-1">from yesterday</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Speed</p>
              <p className="text-2xl font-bold">45 km/h</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">+8%</span>
            <span className="text-gray-500 ml-1">from yesterday</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold">4.2 min</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">-15%</span>
            <span className="text-gray-500 ml-1">from yesterday</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Traffic Flow (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="vehicles" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Vehicle Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vehicleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {vehicleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Incident Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Incident Analysis</h3>
          <div className="space-y-4">
            {incidentTypes.map((incident) => (
              <div key={incident.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{incident.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{incident.count}</Badge>
                  {incident.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Emergency Response</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
                <span className="text-sm font-medium">85%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Traffic Flow Efficiency</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "72%" }}></div>
                </div>
                <span className="text-sm font-medium">72%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Incident Resolution</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "68%" }}></div>
                </div>
                <span className="text-sm font-medium">68%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">System Uptime</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "99%" }}></div>
                </div>
                <span className="text-sm font-medium">99%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
