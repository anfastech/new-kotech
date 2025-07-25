import type { NextRequest } from "next/server"
import { Server } from "socket.io"

let io: Server

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = (global as any).httpServer
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Join rooms based on user type
      socket.on("join-room", (room) => {
        socket.join(room)
        console.log(`Socket ${socket.id} joined room: ${room}`)
      })

      // Handle incident reports
      socket.on("report-incident", (incidentData) => {
        console.log("Incident reported:", incidentData)

        // Broadcast to all clients
        io.emit("incident-update", incidentData)

        // Send emergency alert if critical
        if (incidentData.severity === "critical") {
          io.emit("emergency-alert", {
            type: incidentData.type,
            location: `${incidentData.coordinates[1].toFixed(4)}, ${incidentData.coordinates[0].toFixed(4)}`,
            description: incidentData.description,
          })
        }
      })

      // Handle vehicle updates
      socket.on("vehicle-update", (vehicleData) => {
        socket.broadcast.emit("vehicle-update", vehicleData)
      })

      // Handle traffic updates
      socket.on("traffic-update", (trafficData) => {
        socket.broadcast.emit("traffic-update", trafficData)
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    // Simulate real-time data updates
    setInterval(() => {
      // Simulate vehicle movements
      const mockVehicles = [
        {
          id: "amb-001",
          type: "ambulance",
          coordinates: [75.9064 + (Math.random() - 0.5) * 0.01, 10.9847 + (Math.random() - 0.5) * 0.01],
          status: "emergency",
        },
        {
          id: "fire-001",
          type: "fire",
          coordinates: [75.908 + (Math.random() - 0.5) * 0.01, 10.986 + (Math.random() - 0.5) * 0.01],
          status: "responding",
        },
      ]

      mockVehicles.forEach((vehicle) => {
        io.emit("vehicle-update", vehicle)
      })

      // Simulate traffic updates
      const trafficData = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [75.9, 10.98],
                  [75.91, 10.98],
                  [75.91, 10.99],
                  [75.9, 10.99],
                  [75.9, 10.98],
                ],
              ],
            },
            properties: {
              congestion: Math.random(),
            },
          },
        ],
      }

      io.emit("traffic-update", trafficData)
    }, 5000)
  }

  return new Response("Socket.IO server initialized", { status: 200 })
}
