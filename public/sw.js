// Service Worker for push notifications
self.addEventListener("install", (event) => {
  console.log("Service Worker installing")
  self.skipWaiting() // Activate new service worker as soon as it's ready
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating")
  event.waitUntil(self.clients.claim()) // Take control of existing clients
})

self.addEventListener("push", (event) => {
  console.log("Service Worker received a push event.")
  if (event.data) {
    const data = event.data.json()
    console.log("Push data received:", data)

    const options = {
      body: data.body,
      icon: "/icons/app-icon.png", // Ensure this path is correct
      badge: "/icons/badge.png", // Ensure this path is correct
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
      },
      actions: [
        {
          action: "view",
          title: "View Details",
          icon: "/icons/view.png", // Ensure this path is correct
        },
        {
          action: "close",
          title: "Close",
          icon: "/icons/close.png", // Ensure this path is correct
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  } else {
    console.log("Push event had no data.")
  }
})

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification.tag)
  event.notification.close()

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/")) // Open the main app page
  }
})

// Add a simple fetch handler to prevent the "no-fetch-handler" warning
self.addEventListener("fetch", (event) => {
  // This service worker doesn't need to intercept fetches for now,
  // but having an empty fetch handler prevents a console warning.
  // For a full PWA, you'd add caching strategies here.
})
