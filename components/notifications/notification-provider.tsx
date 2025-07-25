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
  const registerServiceWorker = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        console.log("Service Worker registered with scope:", registration.scope)

        // Request notification permission
        if (Notification.permission === "default") {
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
        } else if (Notification.permission === "granted") {
          console.log("Notification permission already granted.")
        } else {
          console.warn("Notification permission denied or blocked.")
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error)
        toast({
          title: "Notification Error",
          description: `Failed to register service worker: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        })
      }
    } else {
      console.warn("Service Workers are not supported in this browser.")
      toast({
        title: "Notifications Not Supported",
        description: "Your browser does not support service workers for push notifications.",
        variant: "destructive",
      })
    }
  }, [])

  useEffect(() => {
    registerServiceWorker()
  }, [registerServiceWorker])

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
    if (Notification.permission === "granted") {
      new Notification(title, { body })
    } else {
      console.warn("Cannot send notification: permission not granted.")
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
