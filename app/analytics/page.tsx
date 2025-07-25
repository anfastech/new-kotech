"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
import { ArrowLeft, TrendingUp, TrendingDown, Activity, AlertTriangle, Clock } from "lucide-react"
import Link from "next/link"

const trafficData = [
  { time: "00:00", vehicles: 45, incidents: 1 },
  { time: "06:00", vehicles: 120, incidents: 2 },
  { time: "12:00", vehicles: 200, incidents: 5 },
  { time: "18:00", vehicles: 180, incidents: 3 },
  { time: "24:00", vehicles: 60, incidents: 1 },
]

const vehicleDistribution = [
  { name: "Normal Vehicles", value: 150, color: "#6b7280" },
  { name: "City Buses", value: 25, color: "#3b82f6" },
  { name: "School Buses", value: 15, color: "#eab308" },
  { name: "Ambulances", value: 8, color: "#ef4444" },
  { name: "Fire Trucks", value: 2, color: "#f97316" },
]

const incidentTypes = [
  { type: "Traffic Congestion", count: 12, trend: "up" },
  { type: "Accidents", count: 5, trend: "down" },
  { type: "Road Work", count: 3, trend: "stable" },
  { type: "Vehicle Breakdown", count: 7, trend: "up" },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Map
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Traffic Analytics</h1>
          </div>
          <Badge variant="outline">Real-time Data</Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">200</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +12% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                -3 from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45 km/h</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +5% improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2 min</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="w-3 h-3 mr-1 text-green-500" />
                -0.8 min faster
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Flow (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="vehicles" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Incident Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidentTypes.map((incident) => (
                  <div key={incident.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{incident.type}</span>
                      {incident.trend === "up" && <TrendingUp className="w-3 h-3 text-red-500" />}
                      {incident.trend === "down" && <TrendingDown className="w-3 h-3 text-green-500" />}
                      {incident.trend === "stable" && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                    </div>
                    <Badge variant="outline">{incident.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Traffic Efficiency</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Emergency Response</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Incident Resolution</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>System Uptime</span>
                  <span>99.5%</span>
                </div>
                <Progress value={99.5} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
