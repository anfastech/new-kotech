"use client"

import { useEffect, useState, useRef } from "react"

interface Coordinates {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  importance: number
}

interface AutocompleteResult {
  place_id: string
  display_name: string
  lat: string
  lon: string
  type: string
}

export function TestCoordinate() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  
  // Location search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(null)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // API location update function
  const updateLocationAPI = async (latitude: number, longitude: number, accuracy: number, source: string, address?: string) => {
    try {
      const response = await fetch('/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: 'test-coordinate-client',
          coordinates: [longitude, latitude],
          accuracy,
          source,
          address
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Location API updated:', data)
      } else {
        console.error('Failed to update location API')
      }
    } catch (error) {
      console.error('Location API error:', error)
    }
  }

  // Nominatim API for coordinate lookup
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error('Search request failed')
      }
      
      const data = await response.json()
      setSearchResults(data)
      console.log('Search results:', data)
    } catch (error) {
      console.error('Search error:', error)
      setError('Failed to search location')
    } finally {
      setIsSearching(false)
    }
  }

  // LocationIQ API for autocomplete (you'll need to add your API key)
  const getAutocompleteSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAutocompleteResults([])
      return
    }

    try {
      // Note: You'll need to add your LocationIQ API key to .env.local
      const apiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || 'your_locationiq_api_key_here'
      
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(query)}&format=json&limit=5`
      )
      
      if (!response.ok) {
        throw new Error('Autocomplete request failed')
      }
      
      const data = await response.json()
      setAutocompleteResults(data)
      console.log('Autocomplete results:', data)
    } catch (error) {
      console.error('Autocomplete error:', error)
      // Fallback to Nominatim if LocationIQ fails
      searchLocation(query)
    }
  }

  // Handle search input with debouncing
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    setShowAutocomplete(true)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim().length >= 3) {
        getAutocompleteSuggestions(value)
      } else {
        setAutocompleteResults([])
      }
    }, 300)
  }

  // Handle location selection
  const handleLocationSelect = (result: SearchResult | AutocompleteResult) => {
    const selectedResult: SearchResult = {
      place_id: typeof result.place_id === 'string' ? parseInt(result.place_id) : result.place_id,
      display_name: result.display_name,
      lat: result.lat,
      lon: result.lon,
      type: result.type,
      importance: 0
    }
    
    setSelectedLocation(selectedResult)
    setSearchQuery(selectedResult.display_name)
    setShowAutocomplete(false)
    setAutocompleteResults([])
    
    // Log the coordinates
    console.log('Selected location coordinates:')
    console.log('Latitude:', selectedResult.lat)
    console.log('Longitude:', selectedResult.lon)
    console.log('Address:', selectedResult.display_name)
    console.log('---')
    
    // Update coordinates state
    const newCoordinates = {
      latitude: parseFloat(selectedResult.lat),
      longitude: parseFloat(selectedResult.lon),
      accuracy: 0, // No accuracy for searched locations
      timestamp: Date.now()
    }
    setCoordinates(newCoordinates)
    
          // Emit custom event for map component
      window.dispatchEvent(new CustomEvent('test-coordinates-update', {
        detail: {
          latitude: newCoordinates.latitude,
          longitude: newCoordinates.longitude,
          source: 'search'
        }
      }))
      
      // Update location API
      updateLocationAPI(newCoordinates.latitude, newCoordinates.longitude, 0, 'search', selectedResult.display_name)
  }

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    const success = (position: GeolocationPosition) => {
      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      }

      setCoordinates(coords)
      setError(null)

      // Console logging as requested
      console.log('Latitude:', position.coords.latitude)
      console.log('Longitude:', position.coords.longitude)
      console.log('Accuracy:', position.coords.accuracy, 'meters')
      console.log('Timestamp:', new Date(position.timestamp).toLocaleString())
      console.log('---')
      
      // Emit custom event for map component
      window.dispatchEvent(new CustomEvent('test-coordinates-update', {
        detail: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps'
        }
      }))
      
      // Update location API
      updateLocationAPI(position.coords.latitude, position.coords.longitude, position.coords.accuracy, 'gps')
    }

    const error = (error: GeolocationPositionError) => {
      let errorMessage = "Unknown error"
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }
      setError(errorMessage)
      setIsTracking(false)
      console.error('Geolocation error:', errorMessage)
    }

    try {
      const id = navigator.geolocation.watchPosition(success, error, options)
      setWatchId(id)
      setIsTracking(true)
      console.log('Started real-time coordinate tracking...')
      
      // Set up 3-second interval to continuously emit coordinates
      const interval = setInterval(() => {
        if (coordinates) {
          window.dispatchEvent(new CustomEvent('test-coordinates-update', {
            detail: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              accuracy: coordinates.accuracy,
              source: 'gps-interval'
            }
          }))
          
          // Update location API every 3 seconds
          updateLocationAPI(coordinates.latitude, coordinates.longitude, coordinates.accuracy, 'gps-interval')
          
          console.log('3-second interval: Emitting coordinates to map and API')
        }
      }, 3000)
      
      setIntervalId(interval)
    } catch (err) {
      setError("Failed to start location tracking")
      console.error('Failed to start tracking:', err)
    }
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    if (intervalId !== null) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    setIsTracking(false)
    console.log('Stopped coordinate tracking')
  }

  // Clear search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAutocomplete(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [watchId, intervalId])

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[350px] z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">📍 Location Tools</h3>
        <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>

      <div className="space-y-4">
        {/* Location Search */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">🔍 Search Location:</div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Enter address, city, or landmark..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
            {isSearching && (
              <div className="absolute right-2 top-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Autocomplete Results */}
          {showAutocomplete && (autocompleteResults.length > 0 || searchResults.length > 0) && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {(autocompleteResults.length > 0 ? autocompleteResults : searchResults).map((result, index) => (
                <div
                  key={index}
                  className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleLocationSelect(result)}
                >
                  <div className="font-medium text-gray-800 truncate">{result.display_name}</div>
                  <div className="text-gray-500 text-xs">
                    {result.lat}, {result.lon} • {result.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GPS Tracking */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">🎯 GPS Tracking:</div>
          <div className="flex space-x-2">
            <button
              onClick={isTracking ? stopTracking : startTracking}
              className={`px-3 py-2 text-xs rounded font-medium ${
                isTracking
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isTracking ? 'Stop GPS' : 'Start GPS'}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            ⚠️ {error}
          </div>
        )}

        {/* Current Location Display */}
        {coordinates && (
          <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">
              {selectedLocation ? '📍 Searched Location:' : '🎯 Current GPS Location:'}
            </div>
            <div><strong>Latitude:</strong> {coordinates.latitude.toFixed(6)}</div>
            <div><strong>Longitude:</strong> {coordinates.longitude.toFixed(6)}</div>
            {coordinates.accuracy > 0 && (
              <div><strong>Accuracy:</strong> ±{Math.round(coordinates.accuracy)}m</div>
            )}
            <div><strong>Updated:</strong> {new Date(coordinates.timestamp).toLocaleTimeString()}</div>
            {isTracking && (
              <div className="mt-1 text-green-600 text-xs">
                🔄 Auto-refreshing every 3 seconds to map
              </div>
            )}
            {selectedLocation && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-gray-600 text-xs">
                  <div className="font-medium">Address:</div>
                  <div className="truncate">{selectedLocation.display_name}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Information */}
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
          <div className="font-medium mb-1">🔧 APIs Used:</div>
          <div>• Nominatim (OpenStreetMap) for coordinate lookup</div>
          <div>• LocationIQ for autocomplete suggestions</div>
          <div className="mt-1">📋 Console: Open F12 to see coordinate logs</div>
        </div>

        {/* Setup Instructions */}
        <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border border-yellow-200">
          <div className="font-medium mb-1">⚙️ Setup Required:</div>
          <div>Add to .env.local:</div>
          <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
            NEXT_PUBLIC_LOCATIONIQ_API_KEY=your_api_key_here
          </div>
        </div>
      </div>
    </div>
  )
} 