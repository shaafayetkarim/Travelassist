
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Crown, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Card, CardContent } from "@/components/card"
import { apiCall } from "@/lib/api"

interface CommunityPost {
  id: string
  title: string
  preview: string
  author: string
  publishDate: string
  likes: number
  isLiked: boolean
  isWishlisted: boolean
  group: string
}

interface Group {
  id: string
  name: string
  creator: {
    id: string
    name: string
    avatar?: string
  }
  _count: {
    posts: number
  }
  createdAt: string
}

export default function Community() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [error, setError] = useState("")
  const [groupName, setGroupName] = useState("")
  const [creatingGroup, setCreatingGroup] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      if (parsedUser.isPremium) {
        fetchGroups()
      } else {
        setLoading(false)
        setGroupsLoading(false)
      }
    } else {
      window.location.href = "/"
    }
  }, [])




  
  const fetchGroups = async () => {
    try {
      setGroupsLoading(true)
      const response = await apiCall(`/api/groups`)

      if (response && response.ok) {
        const data = await response.json()
        if (data.success) {
          setGroups(data.groups)
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim() || creatingGroup) return

    setCreatingGroup(true)
    try {
      const response = await apiCall("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name: groupName }),
      })

      if (response && response.ok) {
        const data = await response.json()
        if (data.success) {
          setGroups([data.group, ...groups])
          setGroupName("")
        } else {
          alert(data.error || "Failed to create group")
        }
      } else {
        const errorData = response ? await response.json() : { error: "Network error" }
        alert(errorData.error || "Failed to create group")
      }
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group")
    } finally {
      setCreatingGroup(false)
    }
  }

  
  

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user.isPremium) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Premium Feature</h1>
          <p className="text-gray-600 mb-8">Community access is available for premium users only.</p>
          <button className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Upgrade to Premium
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Crown className="w-8 h-8 text-yellow-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Community</h1>
        <span className="ml-3 bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">Premium</span>
      </div>

      <div className="mb-12">
        <div className="flex items-center mb-6">
          <Users className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Groups</h2>
        </div>

        {/* Create Group Form */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleCreateGroup} className="flex gap-2">
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="flex-1"
                required
              />
              <Button
                type="submit"
                disabled={creatingGroup || !groupName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creatingGroup ? "Creating..." : "Create Group"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Groups List */}
        {groupsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Link key={group.id} href={`/community/groups/${group.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Created by {group.creator.name}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{group._count.posts} posts</span>
                      <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {groups.length === 0 && !groupsLoading && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-500">Create the first group to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
