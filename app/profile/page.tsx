

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Lock, Star, Edit, Clock } from "lucide-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"
import { apiCall } from "@/lib/api"

interface ProfileData {
  id: string
  name: string
  email: string
  phone?: string
  interests?: string
  location?: string
  bio?: string
  avatar?: string
  isPremium: boolean
  createdAt: string
}

interface CompletedTrip {
  id: string
  destination: string
  date: string
  rating: number
  participants: {
    id: string
    name: string
    avatar?: string
    rating: number
  }[]
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile")
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<ProfileData>>({})

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (activeTab === "reviews") {
      fetchCompletedTrips()
    }
  }, [activeTab])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await apiCall("/api/profile")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        setEditData(data)
      } else {
        setError("Failed to fetch profile")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedTrips = async () => {
    try {
      const response = await apiCall("/api/profile/trips")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setCompletedTrips(data)
      }
    } catch (error) {
      console.error("Failed to fetch completed trips:", error)
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiCall("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(editData),
      })

      if (!response) return

      if (response.ok) {
        const updatedData = await response.json()
        setProfileData(updatedData)
        setIsEditing(false)
        alert("Profile updated successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update profile")
      }
    } catch (error) {
      alert("Failed to update profile")
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    try {
      const response = await apiCall("/api/profile/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response) return

      if (response.ok) {
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        alert("Password changed successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to change password")
      }
    } catch (error) {
      alert("Failed to change password")
    }
  }

  const handleRateTrip = async (tripId: string, rating: number, reviewType: string) => {
    try {
      const response = await apiCall("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          tripId,
          rating,
          reviewType: "TRIP",
        }),
      })

      if (!response) return

      if (response.ok) {
        // Update the local state
        setCompletedTrips(completedTrips.map((trip) => (trip.id === tripId ? { ...trip, rating } : trip)))
        alert("Rating submitted successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to submit rating")
      }
    } catch (error) {
      alert("Failed to submit rating")
    }
  }

  const handleRateBuddy = async (tripId: string, buddyId: string, rating: number) => {
    try {
      const response = await apiCall("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          tripId,
          reviewedUserId: buddyId,
          rating,
          reviewType: "BUDDY",
        }),
      })

      if (!response) return

      if (response.ok) {
        // Update the local state
        setCompletedTrips(
          completedTrips.map((trip) =>
            trip.id === tripId
              ? {
                ...trip,
                participants: trip.participants.map((participant) =>
                  participant.id === buddyId ? { ...participant, rating } : participant,
                ),
              }
              : trip,
          ),
        )
        alert("Buddy rating submitted successfully!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to submit buddy rating 1 ")
      }
    } catch (error) {
      alert("Failed to submit buddy rating 2")
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-white/5 rounded-2xl w-1/4 border border-white/10"></div>
          <div className="glass-card h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="glass-card text-center py-16 flex flex-col items-center gap-6">
          <p className="text-red-400 font-medium">{error || "Failed to load profile"}</p>
          <button onClick={fetchProfile} className="glass-button bg-primary text-white border-primary/20">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Your Profile</h1>
        {profileData.isPremium && (
          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-amber-500/20 shadow-lg shadow-amber-500/10">
            Premium Member
          </span>
        )}
      </div>

      <div className="mb-12">
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-2 w-fit">
          {[
            { id: "profile", label: "Profile" },
            { id: "password", label: "Security" },
            { id: "reviews", label: "Ratings" },
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
            </button>
          ))}
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Personal Details
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`glass-button text-xs h-10 px-6 ${isEditing ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/5 text-white/60 border-white/10"}`}
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  name="name"
                  value={editData.name || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="glass-input w-full pl-12 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="glass-input w-full pl-12 h-12 opacity-50 cursor-not-allowed bg-white/2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="glass-input w-full pl-12 h-12"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Base Location</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  name="location"
                  value={editData.location || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="glass-input w-full pl-12 h-12"
                  placeholder="e.g. London, UK"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Travel Interests</label>
              <textarea
                name="interests"
                value={editData.interests || ""}
                onChange={handleProfileChange}
                disabled={!isEditing}
                rows={3}
                className="glass-input w-full p-4 resize-none min-h-[100px]"
                placeholder="Adventure, Photography, Fine Dining..."
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Traveler Bio</label>
              <textarea
                name="bio"
                value={editData.bio || ""}
                onChange={handleProfileChange}
                disabled={!isEditing}
                rows={4}
                className="glass-input w-full p-4 resize-none min-h-[120px]"
                placeholder="Share your story..."
              />
            </div>

            {isEditing && (
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  className="glass-button bg-primary text-white border-primary/20 w-full h-14 text-base font-bold shadow-xl shadow-primary/20"
                >
                  Save Profile Changes
                </button>
              </div>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/20" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
              Exploring since {new Date(profileData.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {activeTab === "password" && (
        <div className="glass-card animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-10 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Security Settings
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Current Password</label>
              <div className="relative group">
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="glass-input w-full h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">New Password</label>
              <div className="relative group">
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="glass-input w-full h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/20 ml-1">Confirm New Password</label>
              <div className="relative group">
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="glass-input w-full h-12"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="glass-button bg-primary text-white border-primary/20 w-full h-14 text-base font-bold mt-4 shadow-xl shadow-primary/20"
            >
              Update Security Credentials
            </button>
          </form>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Expedition Reviews
          </h2>

          {completedTrips.length === 0 ? (
            <div className="glass-card py-20 text-center flex flex-col items-center gap-6">
              <Star className="w-12 h-12 text-white/10" />
              <div>
                <h3 className="text-xl font-bold">No completed expeditions</h3>
                <p className="text-white/40 text-sm">Your trip ratings and buddy reviews will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {completedTrips.map((trip) => (
                <div key={trip.id} className="glass-card group">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{trip.destination}</h3>
                      <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">
                        Completed {new Date(trip.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="p-6 bg-white/2 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Overall Expedition Rating</h4>
                      <div className="flex items-center gap-4">
                        {[...Array(5)].map((_, i) => (
                          <button
                            key={i}
                            className="transition-transform hover:scale-125"
                            onClick={() => handleRateTrip(trip.id, i + 1, "DESTINATION")}
                          >
                            <Star className={`w-8 h-8 ${i < trip.rating ? "fill-primary text-primary" : "text-white/10"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {trip.participants.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Buddy Endorsements</h4>
                        <div className="space-y-4">
                          {trip.participants.map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-white/10">
                                  <User className="w-5 h-5 text-white/40" />
                                </div>
                                <span className="text-sm font-bold">{participant.name}</span>
                              </div>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleRateBuddy(trip.id, participant.id, i + 1)}
                                  >
                                    <Star className={`w-4 h-4 ${i < participant.rating ? "fill-primary text-primary" : "text-white/10"}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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



