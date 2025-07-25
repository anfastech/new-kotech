"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { toast } from "sonner"

interface NotificationContextType {
  sendNotification: (title: string, message: string, options?: NotificationOptions) => void
  requestPermission: () => Promise<NotificationPermission>
  permission: NotificationPermission
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    // Check initial permission status
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications")
      return "denied"
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return "denied"
    }
  }

  const sendNotification = (title: string, message: string, options: NotificationOptions = {}) => {
    // Always show toast notification
    toast(title, {
      description: message,
      duration: 4000,
    })

    // Try to show browser notification if permission is granted
    if ("Notification" in window && permission === "granted") {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: "/placeholder-logo.png",
          badge: "/placeholder-logo.png",
          tag: "smart-traffic",
          requireInteraction: false,
          silent: false,
          ...options,
        })

        // Auto-close notification after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        // Handle notification click
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error("Error showing notification:", error)
      }
    } else if (permission === "default") {
      // Auto-request permission for important notifications
      if (title.includes("Emergency") || title.includes("Alert")) {
        requestPermission().then((newPermission) => {
          if (newPermission === "granted") {
            sendNotification(title, message, options)
          }
        })
      }
    }
  }

  const value: NotificationContextType = {
    sendNotification,
    requestPermission,
    permission,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
