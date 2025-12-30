
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Heart, Plus, MapPin, Calendar, Send } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/button"
import { apiCall } from "@/lib/api"

interface Blog {
  id: string
  title: string
  preview: string
  location?: string
  tags: string[]
  images: string[]
  publishDate: string
  author: string
  likes: number
  isLiked: boolean
  isWishlisted: boolean
}

export default function Discovery() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    location: "",
    publishDate: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchBlogs()
  }, [])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchBlogs(searchTerm)
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const fetchBlogs = async (search = "") => {
    try {
      setLoading(true)
      const url = search ? `/api/blogs?search=${encodeURIComponent(search)}` : "/api/blogs"
      const response = await apiCall(url)

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setBlogs(data)
      } else {
        setError("Failed to fetch blogs")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in title and content")
      return
    }

    try {
      setCreateLoading(true)
      const response = await apiCall("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response) return

      if (response.ok) {
        const newBlog = await response.json()
        setBlogs([newBlog, ...blogs])
        setFormData({
          title: "",
          content: "",
          location: "",
          publishDate: new Date().toISOString().split("T")[0],
        })
        setShowCreateForm(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Failed to create blog")
      }
    } catch (error) {
      alert("Network error")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleLike = async (blogId: string) => {
    try {
      const response = await apiCall(`/api/blogs/${blogId}/like`, {
        method: "POST",
      })

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setBlogs(
          blogs.map((blog) =>
            blog.id === blogId
              ? {
                  ...blog,
                  isLiked: data.isLiked,
                  likes: data.likes,
                }
              : blog,
          ),
        )
      }
    } catch (error) {
      console.error("Like error:", error)
    }
  }

  const handleWishlist = async (blogId: string) => {
    try {
      const response = await apiCall(`/api/blogs/${blogId}/wishlist`, {
        method: "POST",
      })

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setBlogs(
          blogs.map((blog) =>
            blog.id === blogId
              ? {
                  ...blog,
                  isWishlisted: data.isWishlisted,
                }
              : blog,
          ),
        )
      }
    } catch (error) {
      console.error("Wishlist error:", error)
    }
  }

  if (loading && blogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchBlogs()} className="bg-black text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Discovery</h1>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-black text-white hover:bg-gray-800 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Write Blog</span>
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search travel blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Your Travel Experience</h2>
            <form onSubmit={handleCreateBlog} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Blog title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <textarea
                  placeholder="Share your travel story..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  className="bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="bg-black text-white hover:bg-gray-800 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{createLoading ? "Posting..." : "Post Blog"}</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No blogs found</p>
          {searchTerm && (
            <Button onClick={() => setSearchTerm("")} variant="outline" className="bg-transparent">
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-lg shadow-sm border p-6">
              <Link href={`/blog/${blog.id}`} className="block mb-4 hover:text-primary-600 transition-colors">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">{blog.title}</h2>
                <p className="text-gray-600">{blog.preview}</p>
                {blog.location && <p className="text-sm text-gray-500 mt-2">📍 {blog.location}</p>}
              </Link>

              {blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => handleLike(blog.id)}
                    variant="ghost"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      blog.isLiked
                        ? "bg-red-50 text-red-600"
                        : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${blog.isLiked ? "fill-current" : ""}`} />
                    <span>{blog.likes}</span>
                  </Button>

                  <Button
                    onClick={() => handleWishlist(blog.id)}
                    variant="ghost"
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      blog.isWishlisted
                        ? "bg-primary-50 text-primary-600"
                        : "bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{blog.isWishlisted ? "Added to Wishlist" : "Add to Wishlist"}</span>
                  </Button>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">By {blog.author}</p>
                  <Link
                    href={`/blog/${blog.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
