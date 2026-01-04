

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, DollarSign, MapPin, Users, Eye, EyeOff, Clock, Sparkles, Rocket } from "lucide-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { apiCall } from "@/lib/api"
import { useNotifications } from "@/lib/notification-context"

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

  const { addNotification } = useNotifications()

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
        addNotification(`Success! Trip to ${formData.destination} created. A confirmation email has been sent to you.`)
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = `/trip/${data.trip.id}`
        }, 1500)
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
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "ended":
        return "bg-white/5 text-white/40 border-white/10"
      default:
        return "bg-primary/20 text-primary-400 border-primary/30"
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
          <Sparkles className="text-primary w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Your Travels</h1>
          <p className="text-white/40 text-sm">Plan, track, and explore your next adventures.</p>
        </div>
      </div>

      <div className="mb-12">
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-2 w-fit">
          {[
            { id: "create", label: "Create Trip" },
            { id: "my-trips", label: "My Trips" },
            { id: "joinable", label: "Joinable Trips" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
            >
              {tab.label}
              {tab.id === "my-trips" && myTripsData && (
                <span className="ml-2 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/30">
                  {myTripsData.stats.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 glass border-red-500/20 rounded-2xl bg-red-500/5 animate-in slide-in-from-top-2">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            {error}
          </p>
        </div>
      )}

      {activeTab === "create" && (
        <div className="glass-card max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-purple-500/5">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full"></span>
            New Adventure Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1">Destination</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Where to next?"
                    className="glass-input w-full pl-12 h-12"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={getAIDestinationSuggestion}
                  disabled={aiSuggestionLoading}
                  className="glass-button h-12 sm:w-fit whitespace-nowrap bg-gradient-to-br from-purple-600/20 to-pink-500/20 border-primary/20 text-primary-400"
                >
                  <Sparkles className={`w-4 h-4 ${aiSuggestionLoading ? "animate-spin" : ""}`} />
                  {aiSuggestionLoading ? "Thinking..." : "AI Suggest"}
                </button>
              </div>

              {destinationSuggestion && (
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 mt-4 animate-in zoom-in-95 duration-300">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    {destinationSuggestion.destination}
                  </h4>
                  <p className="text-white/60 text-sm leading-relaxed italic">
                    {destinationSuggestion.description}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1">Dates</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="glass-input w-full pl-12 h-12 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 pt-2 md:pt-6">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="glass-input w-full pl-12 h-12 [color-scheme:dark]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1">Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="e.g. $500 - $1000"
                    className="glass-input w-full pl-12 h-12"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/40 ml-1">Capacity</Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="2"
                    max="20"
                    className="glass-input w-full pl-12 h-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => handleInputChange({ target: { name: "isPublic", type: "checkbox", checked: !formData.isPublic } } as any)}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.isPublic ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"}`}>
                    {formData.isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">Public Explorer Mode</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Visibility</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isPublic ? "bg-primary" : "bg-white/10"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isPublic ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white text-lg font-bold rounded-2xl hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  Launch Trip
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === "my-trips" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "created", label: "Mine" },
              { key: "joined", label: "Joined" },
              { key: "upcoming", label: "Upcoming" },
              { key: "ongoing", label: "Ongoing" },
              { key: "completed", label: "Completed" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setMyTripsFilter(filter.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${myTripsFilter === filter.key
                  ? "bg-white/10 text-white border-white/20"
                  : "text-white/40 border-transparent hover:text-white"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {myTripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-64 animate-pulse" />
              ))}
            </div>
          ) : getFilteredTrips().length === 0 ? (
            <div className="glass-card py-20 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <Rocket className="w-8 h-8 text-white/20" />
              </div>
              <div>
                <h3 className="text-xl font-bold">No trips found</h3>
                <p className="text-white/40 text-sm">Ready to start your first journey?</p>
              </div>
              <button onClick={() => setActiveTab("create")} className="text-primary text-sm font-bold underline underline-offset-4">Create one now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredTrips().map((trip) => (
                <div key={trip.id} className="glass-card group hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{trip.destination}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        {trip.isCreator ? "Created by you" : `By ${trip.creator.name}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(trip.status || "")}`}>
                      {trip.status || "Upcoming"}
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </div>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      {trip.participantCount} / {trip.maxParticipants} Explorers
                    </div>
                  </div>

                  <button
                    onClick={() => (window.location.href = `/trip/${trip.id}`)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all"
                  >
                    Manage Adventure
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "joinable" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {tripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-64 animate-pulse" />
              ))}
            </div>
          ) : joinableTrips.length === 0 ? (
            <div className="glass-card py-20 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <MapPin className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 font-medium">No public expeditions available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinableTrips.map((trip) => (
                <div key={trip.id} className="glass-card group hover:scale-[1.02]">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{trip.destination}</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                      <Users className="w-4 h-4 text-white/60" />
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-white/40 text-xs line-clamp-2 italic h-8">
                      {trip.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </div>
                  </div>

                  <button
                    onClick={() => (window.location.href = `/trip/${trip.id}`)}
                    className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    Join Expedition
                  </button>
                  <p className="text-[9px] text-center text-white/20 mt-4 uppercase tracking-widest">
                    Expedition Lead: {trip.creator.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}