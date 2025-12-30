



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
    pendingRequests.incoming.length === 0 &&
    pendingRequests.outgoing.length === 0
  ) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => {
              if (activeTab === "find") fetchAvailableBuddies()
              else if (activeTab === "my-buddies") fetchMyBuddies()
              else fetchPendingRequests()
            }}
            className="bg-black text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Travel Buddies</h1>

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("find")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "find"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Find Buddies
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("my-buddies")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "my-buddies"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Buddies
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("requests")}
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === "requests"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Requests
              {pendingRequests?.incoming?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingRequests.incoming.length}
                </span>
              )}
            </Button>
          </nav>
        </div>
      </div>

      {activeTab === "find" && (
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Find Your Perfect Travel Buddy</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex space-x-2">
                  <Button
                    variant={searchMode === "match" ? "default" : "outline"}
                    size="sm"
                    onClick={handleMatchmaking}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span> Matchmaking</span>
                  </Button>
                </div>
              </div>

              {searchMode === "name" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by name ?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3"
                  />
                </div>
              )}

              {searchMode === "match" && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Matchmaking Active</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Buddies are sorted by compatibility based on your likes and wishlist.                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {searchMode === "match" ? "Best Matches for You" : "Available Travel Buddies"}
              </h3>
              <p className="text-sm text-gray-600">
                {availableBuddies.length} {availableBuddies.length === 1 ? "buddy" : "buddies"} found
                {searchTerm && ` for "${searchTerm}"`}
              </p>
            </div>
            {searchMode === "match" && <div className="text-sm text-gray-500">Sorted by compatibility score</div>}
          </div>

          <div className="grid gap-6">
            {availableBuddies.map((buddy) => (
              <div
                key={buddy.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                          <span>{buddy.name}</span>
                          {searchMode === "match" && buddy.isMatch && (
                            <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full">
                              It's a match!
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center text-gray-600 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {buddy.location}
                        </div>
                      </div>
                      
                    </div>

                    <p className="text-gray-600 mb-4">{buddy.tripsCompleted} trips completed</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {buddy.interests.map((interest) => (
                        <span key={interest} className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full">
                          {interest}
                        </span>
                      ))}
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleConnect(buddy.id)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Connect</span>
                      </Button>
                      
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {availableBuddies.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-gray-500 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No buddies found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search terms or use AI matchmaking to find compatible travel partners.
              </p>
              <Button
                onClick={handleMatchmaking}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try AI Matchmaking
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === "my-buddies" && (
        <div>
          {myBuddies.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-500 mb-4">
                <Users className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No buddies yet</h3>
              <p className="text-gray-500 mb-4">Start connecting with other travelers to build your buddy network!</p>
              <Button
                onClick={() => setActiveTab("find")}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Find Buddies
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {myBuddies.map((buddy) => (
                <div
                  key={buddy.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                   
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{buddy.name}</h3>
                          <div className="flex items-center text-gray-600 mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {buddy.location}
                          </div>
                        </div>
                        
                      </div>

                      <p className="text-gray-600 mb-4">{buddy.tripsCompleted} trips completed</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {buddy.interests.map((interest) => (
                          <span
                            key={interest}
                            className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full"
                          >
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
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Incoming Requests ({pendingRequests?.incoming?.length || 0})
            </h2>
            {pendingRequests.incoming === null ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No incoming buddy requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.incoming.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start space-x-4">
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{request.user.name}</h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {request.user.location}
                            </div>
                          </div>
                          
                        </div>

                        <p className="text-gray-600 mb-3">{request.user.tripsCompleted} trips completed</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {request.user.interests.map((interest) => (
                            <span
                              key={interest}
                              className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleRequestAction(request.id, "accept")}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </Button>
                          <Button
                            onClick={() => handleRequestAction(request.id, "decline")}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Decline</span>
                          </Button>
                          <Button variant="outline" className="flex items-center border border-gray-300 bg-transparent">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Sent Requests ({pendingRequests.outgoing.length})
            </h2>
            {pendingRequests.outgoing.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No outgoing buddy requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.outgoing.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start space-x-4">
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{request.user.name}</h3>
                            <div className="flex items-center text-gray-600 mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              {request.user.location}
                            </div>
                          </div>
                          
                        </div>

                        <p className="text-gray-600 mb-3">{request.user.tripsCompleted} trips completed</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {request.user.interests.map((interest) => (
                            <span
                              key={interest}
                              className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-amber-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm">Request pending</span>
                          </div>
                          <Button
                            onClick={() => handleRequestAction(request.id, "cancel")}
                            variant="outline"
                            className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent flex items-center space-x-2"
                          >
                            <UserMinus className="w-4 h-4" />
                            <span>Cancel Request</span>
                          </Button>
                        </div>
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
