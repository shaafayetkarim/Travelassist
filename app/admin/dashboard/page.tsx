"use client"

import { useState, useEffect } from "react"
import { Users, Crown, Trash2, ToggleLeft, ToggleRight, LogOut, Shield, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { apiCall } from "@/lib/api"

interface AdminUser {
  id: string
  name: string
  email: string
  type: string
  isPremium: boolean
  joinDate: string
  tripsCompleted: number
  status: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all") // all, premium, regular
  const [adminUser, setAdminUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user is admin
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      if (userData.type !== "ADMIN") {
        window.location.href = "/"
        return
      }
      setAdminUser(userData)
      fetchUsers()
    } else {
      window.location.href = "/"
    }
  }, [])

  useEffect(() => {
    if (adminUser) {
      fetchUsers()
    }
  }, [searchTerm, filterType, adminUser])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (filterType !== "all") params.append("filter", filterType)

      const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ""}`
      const response = await apiCall(url)

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await apiCall("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth-token")
      localStorage.removeItem("user")
      window.location.href = "/"
    }
  }

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await apiCall(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPremium: !currentStatus }),
      })

      if (!response) return

      if (response.ok) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, isPremium: !currentStatus } : user)))
      } else {
        const data = await response.json()
        alert(data.error || "Failed to update user")
      }
    } catch (error) {
      alert("Failed to update user")
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await apiCall(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response) return

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== userId))
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete user")
      }
    } catch (error) {
      alert("Failed to delete user")
    }
  }

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter((u) => u.isPremium).length,
    regularUsers: users.filter((u) => !u.isPremium).length,
    activeUsers: users.filter((u) => u.status === "active").length,
  }

  if (!adminUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Travel Buddy Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {adminUser.name}</span>
              <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2 bg-transparent">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.premiumUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.regularUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <UserX className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          </div>

          {/* Filters and Search */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className={filterType === "all" ? "bg-black text-white" : "bg-transparent"}
                >
                  All Users
                </Button>
                <Button
                  variant={filterType === "premium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("premium")}
                  className={filterType === "premium" ? "bg-black text-white" : "bg-transparent"}
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Premium
                </Button>
                <Button
                  variant={filterType === "regular" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("regular")}
                  className={filterType === "regular" ? "bg-black text-white" : "bg-transparent"}
                >
                  Regular
                </Button>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/8"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchUsers} className="bg-black text-white">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trips
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {user.name}
                            {user.isPremium && <Crown className="w-4 h-4 text-yellow-500 ml-2" />}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isPremium ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.isPremium ? "Premium" : "Regular"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.tripsCompleted}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePremium(user.id, user.isPremium)}
                            className="flex items-center space-x-1 hover:bg-yellow-50"
                          >
                            {user.isPremium ? (
                              <ToggleRight className="w-4 h-4 text-yellow-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs">{user.isPremium ? "Downgrade" : "Upgrade"}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            className="flex items-center space-x-1 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {users.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
