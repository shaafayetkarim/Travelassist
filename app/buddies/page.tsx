



"use client"

import { useState, useEffect } from "react"
import {
  MapPin,
  Star,
  MessageCircle,
  Search,
  Sparkles,
  UserPlus,
  Check,
  X,
  Clock,
  UserMinus,
  Users,
} from "lucide-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { apiCall } from "@/lib/api"

interface Buddy {
  id: string
  name: string
  location: string
  rating: number
  tripsCompleted: number
  interests: string[]
  avatar: string
  isMatch?: boolean
  commonInterests?: number
}

interface BuddyRequest {
  id: string
  type: "incoming" | "outgoing"
  user: Buddy
  createdAt: string
}

interface PendingRequests {
  incoming: BuddyRequest[]
  outgoing: BuddyRequest[]
}

export default function Buddies() {
  const [activeTab, setActiveTab] = useState("find")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState("name")
  const [availableBuddies, setAvailableBuddies] = useState<Buddy[]>([])
  const [myBuddies, setMyBuddies] = useState<Buddy[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequests>({ incoming: [], outgoing: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (activeTab === "find") {
      fetchAvailableBuddies()
    } else if (activeTab === "my-buddies") {
      fetchMyBuddies()
    } else if (activeTab === "requests") {
      fetchPendingRequests()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === "find" && searchMode === "name") {
      const delayedSearch = setTimeout(() => {
        fetchAvailableBuddies(searchTerm)
      }, 500)
      return () => clearTimeout(delayedSearch)
    }
  }, [searchTerm, searchMode, activeTab])

  const fetchAvailableBuddies = async (search = "") => {
    try {
      setLoading(true)
      const url = search ? `/api/buddies?search=${encodeURIComponent(search)}` : "/api/buddies"
      const response = await apiCall(url)

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setAvailableBuddies(data)
      } else {
        setError("Failed to fetch buddies")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const fetchMyBuddies = async () => {
    try {
      setLoading(true)
      const response = await apiCall("/api/buddies/requests")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setMyBuddies(data)
      } else {
        setError("Failed to fetch your buddies")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await apiCall("/api/buddies/requests/pending")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setPendingRequests(data)
      } else {
        setError("Failed to fetch pending requests")
      }
    } catch (error) {
      console.error("Request action error:", error)
      alert(`Failed to buddy request 2`)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (buddyId: string) => {
    try {
      const response = await apiCall("/api/buddies/requests", {
        method: "POST",
        body: JSON.stringify({ receiverId: buddyId }),
      })

      if (!response) return

      if (response.ok) {
        alert("Buddy request sent!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to send buddy request")
      }
    } catch (error) {
      console.error("Connect error:", error)
      alert("Failed to send buddy request")
    }
  }

  const handleRequestAction = async (requestId: string, action: "accept" | "decline" | "cancel") => {
    try {
      const response = await apiCall(`/api/buddies/requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      })

      if (!response) return

      if (response.ok) {
        fetchPendingRequests()
        if (action === "accept") {
          alert("Buddy request accepted!")
        }
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${action} buddy request 1`)
      }
    } catch (error) {
      console.error("Request action error:", error)
      alert(`Failed to ${action} buddy request 2`)
    }
  }

  const handleMatchmaking = async () => {
    try {
      setLoading(true)
      const response = await apiCall("/api/buddies/matchmaking")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setAvailableBuddies(data)
        setSearchMode("match")
        setSearchTerm("")
      } else {
        setError("Failed to find matches")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const resetToNameSearch = () => {
    setSearchMode("name")
    fetchAvailableBuddies()
    setSearchTerm("")
  }

  const currentBuddies = activeTab === "find" ? availableBuddies : myBuddies

  if (
    loading &&
    currentBuddies.length === 0 &&
    (pendingRequests?.incoming?.length || 0) === 0 &&
    (pendingRequests?.outgoing?.length || 0) === 0
  ) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-white/5 rounded-2xl w-1/4 border border-white/10"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-40 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="glass-card text-center py-16 flex flex-col items-center gap-6">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={() => {
              if (activeTab === "find") fetchAvailableBuddies()
              else if (activeTab === "my-buddies") fetchMyBuddies()
              else fetchPendingRequests()
            }}
            className="glass-button bg-primary text-white border-primary/20"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-12">Travel Buddies</h1>

      <div className="mb-12">
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-2 w-fit">
          {[
            { id: "find", label: "Find Buddies" },
            { id: "my-buddies", label: "My Buddies" },
            { id: "requests", label: "Requests", count: pendingRequests?.incoming?.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
            >
              {tab.label}
              {(tab.count ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "find" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card mb-12">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Sparkles className="text-primary w-5 h-5" />
              Find Your Expert Duo
            </h2>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleMatchmaking}
                  className={`glass-button text-sm ${searchMode === "match" ? "bg-primary text-white border-primary/20" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"}`}
                >
                  <Sparkles className={`w-4 h-4 ${searchMode === "match" ? "text-white" : "text-primary"}`} />
                  AI Matchmaking
                </button>
                {searchMode === "match" && (
                  <button onClick={resetToNameSearch} className="text-xs font-bold text-white/20 hover:text-white transition-colors">
                    Reset Filter
                  </button>
                )}
              </div>

              {searchMode === "name" && (
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full pl-12 h-14"
                  />
                </div>
              )}

              {searchMode === "match" && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 animate-in zoom-in-95">
                  <p className="text-xs text-primary-400 font-medium flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    Buddies sorted by compatibility based on your travel interests.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-lg font-bold">
                {searchMode === "match" ? "Highly Compatible" : "Nearby Explorers"}
              </h3>
              <p className="text-xs text-white/40 uppercase tracking-widest mt-1">
                {availableBuddies.length} Potential Partners Found
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableBuddies.map((buddy) => (
              <div
                key={buddy.id}
                className="glass-card group hover:bg-white/10 transition-all duration-500"
              >
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10 overflow-hidden">
                      <Users className="w-8 h-8 text-white/20" />
                    </div>
                    {searchMode === "match" && buddy.isMatch && (
                      <div className="absolute -bottom-2 -left-2 bg-primary text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg shadow-xl animate-bounce">
                        Match!
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {buddy.name}
                        </h3>
                        <div className="flex items-center text-white/40 text-xs mt-1">
                          <MapPin className="w-3 h-3 mr-1 text-primary" />
                          {buddy.location}
                        </div>
                      </div>
                    </div>

                    <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4">
                      {buddy.tripsCompleted} Expeditions Completed
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {buddy.interests.map((interest) => (
                        <span key={interest} className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                          {interest}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleConnect(buddy.id)}
                      className="glass-button bg-primary text-white border-primary/20 w-full h-11"
                    >
                      <UserPlus className="w-4 h-4" />
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {availableBuddies.length === 0 && !loading && (
            <div className="glass-card py-20 text-center flex flex-col items-center gap-6">
              <Search className="w-12 h-12 text-white/10" />
              <div>
                <h3 className="text-xl font-bold">No buddies found</h3>
                <p className="text-white/40 text-sm">Try broadening your search or use AI matchmaking.</p>
              </div>
              <button
                onClick={handleMatchmaking}
                className="glass-button bg-primary text-white border-primary/20"
              >
                <Sparkles className="w-4 h-4" />
                Try AI Matching
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "my-buddies" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {myBuddies.length === 0 ? (
            <div className="glass-card py-20 text-center flex flex-col items-center gap-6">
              <Users className="w-12 h-12 text-white/10" />
              <div>
                <h3 className="text-xl font-bold">Forge New Connections</h3>
                <p className="text-white/40 text-sm">Start building your network of elite travelers.</p>
              </div>
              <button
                onClick={() => setActiveTab("find")}
                className="glass-button bg-primary text-white border-primary/20"
              >
                Find Buddies
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myBuddies.map((buddy) => (
                <div
                  key={buddy.id}
                  className="glass-card group hover:bg-white/10 transition-all duration-500"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Users className="w-8 h-8 text-white/20" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{buddy.name}</h3>
                      <div className="flex items-center text-white/40 text-xs mt-1">
                        <MapPin className="w-3 h-3 mr-1 text-primary" />
                        {buddy.location}
                      </div>

                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4 mb-4">
                        {buddy.tripsCompleted} Trips Together
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {buddy.interests.map((interest) => (
                          <span key={interest} className="text-[10px] font-bold text-white/60 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
          <div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Incoming Requests
              <span className="text-xs text-white/20 font-bold ml-2">({pendingRequests?.incoming?.length || 0})</span>
            </h2>
            {(!pendingRequests.incoming || pendingRequests.incoming.length === 0) ? (
              <div className="glass-card py-16 text-center text-white/20 text-sm italic">
                No new expedition requests
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingRequests.incoming.map((request) => (
                  <div key={request.id} className="glass-card group">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Users className="w-6 h-6 text-white/20" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{request.user.name}</h3>
                        <p className="text-xs text-white/40 mt-1">{request.user.location}</p>

                        <div className="flex gap-2 mt-6">
                          <button
                            onClick={() => handleRequestAction(request.id, "accept")}
                            className="flex-1 h-10 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold hover:bg-green-500 transition-all hover:text-white"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, "decline")}
                            className="flex-1 h-10 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold hover:bg-red-500 transition-all hover:text-white"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Sent Requests
              <span className="text-xs text-white/20 font-bold ml-2">({pendingRequests.outgoing.length})</span>
            </h2>
            {pendingRequests.outgoing.length === 0 ? (
              <div className="glass-card py-16 text-center text-white/20 text-sm italic">
                You haven't sent any requests yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingRequests.outgoing.map((request) => (
                  <div key={request.id} className="glass-card opacity-80">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Users className="w-6 h-6 text-white/20" />
                      </div>
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold">{request.user.name}</h3>
                          <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                            <Clock className="w-3 h-3" />
                            Pending Response
                          </div>
                        </div>
                        <button
                          onClick={() => handleRequestAction(request.id, "cancel")}
                          className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

