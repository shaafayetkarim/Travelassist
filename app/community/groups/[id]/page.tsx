

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Textarea } from "@/components/textarea"
import { Card, CardContent } from "@/components/card"
import { ArrowLeft, MapPin, Calendar, Send } from "lucide-react"
import { apiCall } from "@/lib/api"
import Link from "next/link"

interface GroupPost {
  id: string
  title: string
  content: string
  location?: string
  postDate: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
}

interface Group {
  id: string
  name: string
  creator: {
    id: string
    name: string
    avatar?: string
  }
  posts: GroupPost[]
}

export default function GroupPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    location: "",
    postDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (groupId) {
      fetchGroup()
    }
  }, [groupId])

  const fetchGroup = async () => {
    try {
      const response = await apiCall(`/api/groups/${groupId}`)
      if (response && response.ok) {
        const data = await response.json()
        if (data.success) {
          setGroup(data.group)
        } else {
          console.error("Failed to fetch group:", data.error)
        }
      } else {
        console.error("Failed to fetch group: HTTP", response?.status)
      }
    } catch (error) {
      console.error("Error fetching group:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postData.title.trim() || !postData.content.trim() || posting) return

    setPosting(true)
    try {
      const response = await apiCall(`/api/groups/${groupId}/posts`, {
        method: "POST",
        body: JSON.stringify(postData),
      })

      if (response && response.ok) {
        const data = await response.json()
        if (data.success) {
          setGroup((prev) =>
            prev
              ? {
                  ...prev,
                  posts: [data.post, ...prev.posts],
                }
              : null,
          )
          setPostData({
            title: "",
            content: "",
            location: "",
            postDate: new Date().toISOString().split("T")[0],
          })
          setShowPostForm(false)
        } else {
          alert(data.error || "Failed to create post")
        }
      } else {
        const errorData = response ? await response.json() : { error: "Network error" }
        alert(errorData.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      alert("Failed to create post")
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h2>
          <Link href="/community">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/community">
            <Button variant="outline" className="mb-4 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
          <p className="text-gray-600">Created by {group.creator.name}</p>
        </div>

        {/* Create Post Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {!showPostForm ? (
              <Button onClick={() => setShowPostForm(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="w-4 h-4 mr-2" />
                Write a Post
              </Button>
            ) : (
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <Input
                    type="text"
                    value={postData.title}
                    onChange={(e) => setPostData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Post title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <Textarea
                    value={postData.content}
                    onChange={(e) => setPostData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your thoughts..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                    <Input
                      type="text"
                      value={postData.location}
                      onChange={(e) => setPostData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Where is this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <Input
                      type="date"
                      value={postData.postDate}
                      onChange={(e) => setPostData((prev) => ({ ...prev, postDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={posting || !postData.title.trim() || !postData.content.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {posting ? "Posting..." : "Post"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPostForm(false)
                      setPostData({
                        title: "",
                        content: "",
                        location: "",
                        postDate: new Date().toISOString().split("T")[0],
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Posts */}
        <div className="space-y-6">
          {group.posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{post.author.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
                      <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h3>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {post.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{post.location}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{new Date(post.postDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {group.posts.length === 0 && (
          <div className="text-center py-12">
            <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share something in this group!</p>
          </div>
        )}
      </div>
    </div>
  )
}
