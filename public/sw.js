// Service Worker for push notifications
self.addEventListener("install", (event) => {
  console.log("Service Worker installing")
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating")
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: "/icons/app-icon.png",
      badge: "/icons/badge.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
      },
      actions: [
        {
          action: "view",
          title: "View Details",
          icon: "/icons/view.png",
        },
        {
          action: "close",
          title: "Close",
          icon: "/icons/close.png",
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"))
  }
})
