

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Calendar, DollarSign, MapPin, Users, Plus, Check, Trash2, Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiCall } from "@/lib/api"

interface TripData {
  id: string
  destination: string
  startDate: string
  endDate: string
  budget: string
  isPublic: boolean
  creator: string
  creatorId: string
  participants: Array<{
    id: string
    name: string
    role: string
    avatar?: string
    joinedAt: string
  }>
  description?: string
  maxParticipants: number
  status: "OPEN" | "ONGOING" | "ENDED"
  todoItems: Array<{
    id: string
    text: string
    completed: boolean
    createdBy: string
    createdAt: string
  }>
  createdAt: string
}

export default function TripDetails() {
  const params = useParams()
  const tripId = params.id as string
  const [trip, setTrip] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newTodo, setNewTodo] = useState("")
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [hasJoined, setHasJoined] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (tripId) {
      fetchTrip()
    }
  }, [tripId])

  const fetchTrip = async () => {
    try {
      setLoading(true)
      const response = await apiCall(`/api/trips/${tripId}`)

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setTrip(data)
      } else {
        setError("Trip not found")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTrip = async () => {
    try {
      const response = await apiCall(`/api/trips/${tripId}/join`, {
        method: "POST",
      })

      if (!response) return

      if (response.ok) {
        setHasJoined(true)
        // Refresh trip data to show updated participants
        fetchTrip()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to join trip")
      }
    } catch (error) {
      alert("Failed to join trip")
    }
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const response = await apiCall(`/api/trips/${tripId}/todos`, {
        method: "POST",
        body: JSON.stringify({ text: newTodo.trim() }),
      })

      if (!response) return

      if (response.ok) {
        const newTodoItem = await response.json()
        setTrip((prev) => ({
          ...prev!,
          todoItems: [...prev!.todoItems, newTodoItem],
        }))
        setNewTodo("")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to add todo")
      }
    } catch (error) {
      alert("Failed to add todo")
    }
  }

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const response = await apiCall(`/api/todos/${todoId}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !completed }),
      })

      if (!response) return

      if (response.ok) {
        setTrip((prev) => ({
          ...prev!,
          todoItems: prev!.todoItems.map((todo) => (todo.id === todoId ? { ...todo, completed: !completed } : todo)),
        }))
      }
    } catch (error) {
      console.error("Toggle todo error:", error)
    }
  }

  const deleteTodo = async (todoId: string) => {
    try {
      const response = await apiCall(`/api/todos/${todoId}`, {
        method: "DELETE",
      })

      if (!response) return

      if (response.ok) {
        setTrip((prev) => ({
          ...prev!,
          todoItems: prev!.todoItems.filter((todo) => todo.id !== todoId),
        }))
      }
    } catch (error) {
      console.error("Delete todo error:", error)
    }
  }

  const startEdit = (todoId: string, text: string) => {
    setIsEditing(todoId)
    setEditText(text)
  }

  const saveEdit = async (todoId: string) => {
    if (!editText.trim()) return

    try {
      const response = await apiCall(`/api/todos/${todoId}`, {
        method: "PATCH",
        body: JSON.stringify({ text: editText.trim() }),
      })

      if (!response) return

      if (response.ok) {
        setTrip((prev) => ({
          ...prev!,
          todoItems: prev!.todoItems.map((todo) => (todo.id === todoId ? { ...todo, text: editText.trim() } : todo)),
        }))
        setIsEditing(null)
        setEditText("")
      }
    } catch (error) {
      console.error("Edit todo error:", error)
    }
  }

  const cancelEdit = () => {
    setIsEditing(null)
    setEditText("")
  }

  const handleStatusChange = async (newStatus: "OPEN" | "ONGOING" | "ENDED") => {
    if (!trip || !currentUser || trip.creatorId !== currentUser.id) return

    try {
      setIsUpdatingStatus(true)
      const response = await apiCall(`/api/trips/${tripId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response) return

      if (response.ok) {
        setTrip((prev) => (prev ? { ...prev, status: newStatus } : null))
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update trip status")
      }
    } catch (error) {
      alert("Failed to update trip status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800"
      case "ONGOING":
        return "bg-blue-100 text-blue-800"
      case "ENDED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-red-700"
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Trip not found"}</h1>
          <Link href="/trip" className="text-primary-600 hover:text-primary-700">
            Return to Trips
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = currentUser && trip.creatorId === currentUser.id
  const isParticipant = currentUser && trip.participants.some((p) => p.id === currentUser.id)
  const canEdit = isCreator || isParticipant
  const canJoin = currentUser && !isParticipant && trip.participants.length < trip.maxParticipants && trip.isPublic

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/trip" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Trips
      </Link>

      {/* Trip Details */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.destination}</h1>
            <p className="text-gray-600">Created by {trip.creator}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Users className="w-4 h-4 mr-1" />
              {trip.participants.length}/{trip.maxParticipants} participants
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                trip.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {trip.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-3" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-sm">
                {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center text-gray-600">
            <DollarSign className="w-5 h-5 mr-3" />
            <div>
              <p className="font-medium">Budget</p>
              <p className="text-sm">{trip.budget}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-5 h-5 mr-3" />
            <div>
              <p className="font-medium">Destination</p>
              <p className="text-sm">{trip.destination}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-600">
            <div
              className={`w-3 h-3 rounded-full mr-3 ${
                trip.status === "ENDED" ? "bg-gray-500" : trip.status === "ONGOING" ? "bg-blue-500" : "bg-green-500"
              }`}
            />
            <div className="flex-1">
              <p className="font-medium">Status</p>
              {isCreator ? (
                <select
                  value={trip.status}
                  onChange={(e) => handleStatusChange(e.target.value as "OPEN" | "ONGOING" | "ENDED")}
                  disabled={isUpdatingStatus}
                  className="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px]"
                >
                  <option value="OPEN">Open</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="ENDED">Ended</option>
                </select>
              ) : (
                <span className="text-sm font-medium text-gray-800">{trip.status}</span>

              )}
            </div>
          </div>
        </div>

        {trip.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{trip.description}</p>
          </div>
        )}

        {/* Join Trip Button */}
        {canJoin && (
          <div className="mb-6">
            <button
              onClick={handleJoinTrip}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Join This Trip
            </button>
          </div>
        )}

        {hasJoined && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">🎉 You've successfully joined this trip!</p>
          </div>
        )}

        {/* Participants */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Who's Joining</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trip.participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {participant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{participant.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{participant.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Todo List Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Trip Activities & To-Do List</h2>
          {!canEdit && <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">View Only</span>}
        </div>

        {/* Add new todo - only for creators and participants */}
        {canEdit && (
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new activity..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
            />
            <button
              onClick={addTodo}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </button>
          </div>
        )}

        {/* Todo list */}
        <div className="space-y-3">
          {trip.todoItems.map((todo) => (
            <div key={todo.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleTodo(todo.id, todo.completed)}
                disabled={!canEdit}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? "bg-black border-black text-white"
                    : canEdit
                      ? "border-gray-300 hover:border-black"
                      : "border-gray-300"
                } ${!canEdit ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {todo.completed && <Check className="w-3 h-3" />}
              </button>

              {isEditing === todo.id && canEdit ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") saveEdit(todo.id)
                      if (e.key === "Escape") cancelEdit()
                    }}
                    autoFocus
                  />
                  <button onClick={() => saveEdit(todo.id)} className="text-black hover:text-gray-700">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-700">
                    ×
                  </button>
                </div>
              ) : (
                <>
                  <span className={`flex-1 ${todo.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                    {todo.text}
                  </span>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => startEdit(todo.id, todo.text)}
                        className="text-gray-400 hover:text-black transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {trip.todoItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>
              No activities added yet.{" "}
              {canEdit ? "Start planning your trip!" : "The trip organizer hasn't added activities yet."}
            </p>
          </div>
        )}

        {/* Progress indicator */}
        {trip.todoItems.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">
                {trip.todoItems.filter((t) => t.completed).length} of {trip.todoItems.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    trip.todoItems.length > 0
                      ? (trip.todoItems.filter((t) => t.completed).length / trip.todoItems.length) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Permission info */}
        {!canEdit && !canJoin && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> You can view this trip's details and activities, but you need to join the trip to
              participate in planning.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
