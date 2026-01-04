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
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2 border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-primary/30">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight uppercase">Command Center</h1>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Travel Buddy Authority</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{adminUser.name}</p>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Root Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="glass-button text-xs h-10 px-6 bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 shadow-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "blue" },
            { label: "Premium Tier", value: stats.premiumUsers, icon: Crown, color: "amber" },
            { label: "Regular Tier", value: stats.regularUsers, icon: UserCheck, color: "slate" },
            { label: "Active Nodes", value: stats.activeUsers, icon: UserX, color: "emerald" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-6 border-white/5 group hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                </div>
                <div className="w-8 h-1 bg-white/5 rounded-full" />
              </div>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* User Management Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-2">Entity Registry</h2>
              <p className="text-sm text-white/40 font-medium">Monitor and manage all system participants.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex gap-1">
                {["all", "premium", "regular"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                      ? "bg-white/10 text-white shadow-lg"
                      : "text-white/30 hover:text-white"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="relative group min-w-[280px]">
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full h-11 pl-4"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-0 overflow-hidden border-white/5">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-white/2 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-20 text-center flex flex-col items-center gap-6">
                <p className="text-red-400 font-medium">{error}</p>
                <button onClick={fetchUsers} className="glass-button bg-white text-black border-transparent">
                  Retry Initialization
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Entity Details</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Classification</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Throughput</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Uptime</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 text-right">Directives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-sm font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-2">
                                {user.name}
                                {user.isPremium && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                              </div>
                              <div className="text-xs text-white/20 font-medium">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${user.isPremium
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-white/5 text-white/40 border-white/10"
                            }`}>
                            {user.isPremium ? "Premium" : "Regular"}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{user.tripsCompleted}</span>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Trips</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-medium text-white/40">
                            {new Date(user.joinDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => togglePremium(user.id, user.isPremium)}
                              title={user.isPremium ? "Downgrade Authority" : "Escalate Authority"}
                              className={`p-2 rounded-lg border transition-all ${user.isPremium
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : "bg-white/5 border-white/10 text-white/20 hover:text-white"
                                }`}
                            >
                              {user.isPremium ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              title="Terminate Entity"
                              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {users.length === 0 && !loading && !error && (
              <div className="py-24 text-center">
                <div className="flex flex-col items-center gap-6 opacity-30">
                  <Users className="w-12 h-12" />
                  <p className="font-bold tracking-[0.2em] uppercase text-sm">No entities registered in this sector</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

