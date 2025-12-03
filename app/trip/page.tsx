

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, DollarSign, MapPin, Users, Eye, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { apiCall } from "@/lib/api"

interface Trip {
  id: string
  destination: string
  startDate: string
  endDate: string
  budget: string
  description?: string
  isPublic: boolean
  maxParticipants: number
  status?: string
  creator: {
    id: string
    name: string
    avatar?: string
  }
  participants: Array<{
    id: string
    name: string
    avatar?: string
    role: string
    joinedAt: string
  }>
  participantCount: number
  userRole?: string
  isCreator?: boolean
  progress?: number
  todoStats?: {
    completed: number
    total: number
  }
  createdAt: string
}

interface MyTripsData {
  trips: Trip[]
  categories: {
    created: Trip[]
    joined: Trip[]
    upcoming: Trip[]
    ongoing: Trip[]
    completed: Trip[]
  }
  stats: {
    total: number
    created: number
    joined: number
    upcoming: number
    ongoing: number
    completed: number
  }
}

export default function Trip() {
  const [activeTab, setActiveTab] = useState("create")
  const [myTripsFilter, setMyTripsFilter] = useState("all")
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: "",
    isPublic: true,
    maxParticipants: 6,
  })
  const [joinableTrips, setJoinableTrips] = useState<Trip[]>([])
  const [myTripsData, setMyTripsData] = useState<MyTripsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tripsLoading, setTripsLoading] = useState(false)
  const [myTripsLoading, setMyTripsLoading] = useState(false)
  const [error, setError] = useState("")
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)
  const [destinationSuggestion, setDestinationSuggestion] = useState<{
    destination: string
    description: string
  } | null>(null)

  useEffect(() => {
    if (activeTab === "joinable") {
      fetchJoinableTrips()
    } else if (activeTab === "my-trips") {
      fetchMyTrips()
    }
  }, [activeTab])

  const fetchJoinableTrips = async () => {
    try {
      setTripsLoading(true)
      const response = await apiCall("/api/trips")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setJoinableTrips(data.trips || [])
      } else {
        setError("Failed to fetch trips")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setTripsLoading(false)
    }
  }

  const fetchMyTrips = async () => {
    try {
      setMyTripsLoading(true)
      const response = await apiCall("/api/trips/my")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setMyTripsData(data)
      } else {
        setError("Failed to fetch your trips")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setMyTripsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await apiCall("/api/trips", {
        method: "POST",
        body: JSON.stringify(formData),
      })

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        // Redirect to the new trip page
        window.location.href = `/trip/${data.trip.id}`
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create trip")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const getAIDestinationSuggestion = async () => {
    try {
      setAiSuggestionLoading(true)
      setDestinationSuggestion(null)
      
      const response = await apiCall("/api/destinations/random")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setDestinationSuggestion(data)
        setFormData((prev) => ({ ...prev, destination: data.destination }))
      } else {
        setError("Failed to get destination suggestion")
      }
    } catch (error) {
      setError("Network error while fetching suggestion")
    } finally {
      setAiSuggestionLoading(false)
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ongoing":
        return "bg-green-100 text-green-800"
      case "ended":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getFilteredTrips = () => {
    if (!myTripsData) return []

    switch (myTripsFilter) {
      case "created":
        return myTripsData.categories.created
      case "joined":
        return myTripsData.categories.joined
      case "upcoming":
        return myTripsData.categories.upcoming
      case "ongoing":
        return myTripsData.categories.ongoing
      case "completed":
        return myTripsData.categories.completed
      default:
        return myTripsData.trips
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Trip</h1>

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("create")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "create"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Create Trip
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("my-trips")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "my-trips"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Trips
              {myTripsData && (
                <span className="ml-2 bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                  {myTripsData.stats.total}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("joinable")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "joinable"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Joinable Trips
            </Button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {activeTab === "create" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Trip</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Destination</Label>
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination manually..."
                    className="w-full pl-10 pr-4 py-3"
                    required
                  />
                </div>
                <Button
                  type="button"
                  onClick={getAIDestinationSuggestion}
                  disabled={aiSuggestionLoading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 disabled:opacity-50"
                >
                  {aiSuggestionLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Getting Suggestion...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Surprise Me</span>
                    </>
                  )}
                </Button>
                
                {destinationSuggestion && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-lg text-gray-900 mb-2">
                      {destinationSuggestion.destination}
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {destinationSuggestion.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="e.g., $500-800"
                  className="w-full pl-10 pr-4 py-3"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Description & Safety Tips (Optional)</Label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell others about your trip plans..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</Label>
              <Input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="2"
                max="20"
                className="w-full px-4 py-3"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <Label className="ml-2 block text-sm text-gray-700">Make this trip public (others can join)</Label>
              {formData.isPublic ? (
                <Eye className="ml-2 w-4 h-4 text-green-500" />
              ) : (
                <EyeOff className="ml-2 w-4 h-4 text-gray-400" />
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Creating Trip..." : "Create Trip"}
            </Button>
          </form>
        </div>
      )}

      {activeTab === "my-trips" && (
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Trips", count: myTripsData?.stats.total },
              { key: "created", label: "Created by Me", count: myTripsData?.stats.created },
              { key: "joined", label: "Joined", count: myTripsData?.stats.joined },
              { key: "upcoming", label: "Upcoming", count: myTripsData?.stats.upcoming },
              { key: "ongoing", label: "Ongoing", count: myTripsData?.stats.ongoing },
              { key: "completed", label: "Completed", count: myTripsData?.stats.completed },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant="ghost"
                onClick={() => setMyTripsFilter(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  myTripsFilter === filter.key ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
                {filter.count !== undefined && filter.count > 0 && (
                  <span className="ml-2 text-xs">({filter.count})</span>
                )}
              </Button>
            ))}
          </div>

          {myTripsLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : getFilteredTrips().length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {myTripsFilter === "all" ? "No trips yet" : `No ${myTripsFilter} trips`}
              </h3>
              <p className="text-gray-600">
                {myTripsFilter === "created"
                  ? "Create your first trip to get started!"
                  : myTripsFilter === "joined"
                    ? "Join some trips to see them here!"
                    : "Your trips will appear here based on their status."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {getFilteredTrips().map((trip) => (
                <div key={trip.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{trip.destination}</h3>
                        {trip.status && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                            {trip.status}
                          </span>
                        )}
                        {trip.isCreator && (
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            Creator
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {trip.isCreator ? "Created by you" : `Created by ${trip.creator.name}`}
                      </p>
                      {trip.description && <p className="text-gray-600 text-sm mt-1">{trip.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Users className="w-4 h-4 mr-1" />
                        {trip.participantCount}/{trip.maxParticipants} joined
                      </div>
                      {!trip.isPublic && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {trip.budget}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Role: {trip.userRole}
                    </div>
                  </div>

                  {trip.todoStats && trip.todoStats.total > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Trip Progress</span>
                        <span className="text-sm text-gray-600">
                          {trip.todoStats.completed}/{trip.todoStats.total} activities completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trip.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => (window.location.href = `/trip/${trip.id}`)}
                      className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      View Details
                    </Button>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "joinable" && (
        <div>
          {tripsLoading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : joinableTrips.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips available</h3>
              <p className="text-gray-600">Be the first to create a public trip!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {joinableTrips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{trip.destination}</h3>
                      <p className="text-gray-600">Created by {trip.creator.name}</p>
                      {trip.description && <p className="text-gray-600 text-sm mt-1">{trip.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {trip.participantCount}/{trip.maxParticipants} joined
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {trip.budget}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => (window.location.href = `/trip/${trip.id}`)}
                      className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      View Details
                    </Button>
                    
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}