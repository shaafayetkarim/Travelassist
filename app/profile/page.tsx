

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Lock, Star, Edit } from "lucide-react"
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
          reviewType:"TRIP",
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error || "Failed to load profile"}</p>
          <Button onClick={fetchProfile} className="bg-black text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        {profileData.isPremium && null}
      </div>

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Button
              variant="ghost"
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile Info
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("password")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Change Password
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab("reviews")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Reviews & Ratings
            </Button>
          </nav>
        </div>
      </div>

      {activeTab === "profile" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="flex items-center space-x-2 bg-transparent"
            >
              <Edit className="w-4 h-4" />
              <span>{isEditing ? "Cancel" : "Edit"}</span>
            </Button>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  name="name"
                  value={editData.name || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input type="email" value={profileData.email} disabled className="w-full pl-10 pr-4 py-3 bg-gray-50" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="tel"
                  name="phone"
                  value={editData.phone || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  name="location"
                  value={editData.location || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3"
                  placeholder="Enter your location"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Travel Interests</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <Textarea
                  name="interests"
                  value={editData.interests || ""}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3"
                  placeholder="e.g., Adventure, Photography, Culture, Food"
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Bio</Label>
              <Textarea
                name="bio"
                value={editData.bio || ""}
                onChange={handleProfileChange}
                disabled={!isEditing}
                rows={4}
                className="w-full px-4 py-3"
                placeholder="Tell us about yourself and your travel experiences..."
              />
            </div>

            {isEditing && (
              <Button
                type="submit"
                className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Update Profile
              </Button>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">Member since {new Date(profileData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {activeTab === "password" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-3"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-3"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-3"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Change Password
            </Button>
          </form>
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews & Ratings</h2>

          {completedTrips.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed trips yet</h3>
              <p className="text-gray-500">Complete some trips to leave reviews and ratings!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {completedTrips.map((trip) => (
                <div key={trip.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{trip.destination}</h3>
                      <p className="text-gray-600">{new Date(trip.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Overall Experience</h4>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            className="text-yellow-400 hover:text-yellow-500 p-0"
                            onClick={() => handleRateTrip(trip.id, i + 1, "DESTINATION")}
                          >
                            <Star className={`w-5 h-5 ${i < trip.rating ? "fill-current" : ""}`} />
                          </Button>
                        ))}
                      </div>
                    </div>

                    {trip.participants.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Rate Trip Buddies</h4>
                        <div className="space-y-3">
                          {trip.participants.map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {participant.avatar ? (
                                    <img
                                      src={participant.avatar || "/placeholder.svg"}
                                      alt={participant.name}
                                      className="w-8 h-8 rounded-full"
                                    />
                                  ) : (
                                    <User className="w-4 h-4 text-gray-500" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{participant.name}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Button
                                    key={i}
                                    variant="ghost"
                                    className="text-yellow-400 hover:text-yellow-500 p-0"
                                    onClick={() => handleRateBuddy(trip.id, participant.id, i + 1)}
                                  >
                                    <Star className={`w-4 h-4 ${i < participant.rating ? "fill-current" : ""}`} />
                                  </Button>
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


