"use client"

import type React from "react"
import { useEffect, createContext, useContext, useCallback } from "react"
import { toast } from "@/components/ui/use-toast"

interface NotificationContextType {
  requestPermission: () => Promise<void>
  sendNotification: (title: string, body: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auto-request notification permission on load
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast({
            title: "Notifications Enabled",
            description: "You will receive real-time traffic alerts.",
          })
        }
      })
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You will receive real-time traffic alerts.",
        })
      } else {
        toast({
          title: "Notifications Denied",
          description: "You will not receive real-time traffic alerts.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser does not support notifications.",
        variant: "destructive",
      })
    }
  }, [])

  const sendNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/placeholder.svg?height=64&width=64",
        badge: "/placeholder.svg?height=32&width=32",
      })
    } else {
      // Fallback to toast notification
      toast({
        title,
        description: body,
      })
    }
  }, [])

  return (
    <NotificationContext.Provider value={{ requestPermission, sendNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
