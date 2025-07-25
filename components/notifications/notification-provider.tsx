"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useSocket } from "@/components/providers/socket-provider"

interface NotificationContextType {
  requestPermission: () => Promise<boolean>
  sendNotification: (title: string, body: string, options?: NotificationOptions) => void
}

const NotificationContext = createContext<NotificationContextType>({
  requestPermission: async () => false,
  sendNotification: () => {},
})

export function useNotifications() {
  return useContext(NotificationContext)
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { socket } = useSocket()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("emergency-alert", (data) => {
      sendNotification("Emergency Alert", `${data.type} reported at ${data.location}`, {
        icon: "/icons/emergency.png",
        badge: "/icons/badge.png",
        tag: "emergency",
      })
    })

    socket.on("traffic-alert", (data) => {
      sendNotification("Traffic Alert", `Heavy congestion detected on ${data.road}`, {
        icon: "/icons/traffic.png",
        badge: "/icons/badge.png",
        tag: "traffic",
      })
    })

    return () => {
      socket.off("emergency-alert")
      socket.off("traffic-alert")
    }
  }, [socket])

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icons/app-icon.png",
        badge: "/icons/badge.png",
        ...options,
      })
    }
  }

  return (
    <NotificationContext.Provider value={{ requestPermission, sendNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}
