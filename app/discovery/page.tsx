
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-white/5 rounded-2xl w-1/3 border border-white/10"></div>
          <div className="h-14 bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-48 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="glass-card text-center py-16 flex flex-col items-center gap-6">
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={() => fetchBlogs()} className="glass-button bg-primary text-white border-primary/20">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">Discovery</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="glass-button bg-primary text-white border-primary/20 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Write Blog</span>
          </button>
        </div>

        <div className="relative mb-8 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search travel blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-12 h-14 text-base"
          />
        </div>

        {showCreateForm && (
          <div className="glass-card mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              Share Your Journey
            </h2>
            <form onSubmit={handleCreateBlog} className="space-y-6">
              <input
                type="text"
                placeholder="Captivating title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="glass-input w-full h-12"
                required
              />

              <textarea
                placeholder="Tell your story..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="glass-input w-full py-4 resize-none"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Where was this?"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="glass-input w-full pl-12 h-12"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                    className="glass-input w-full pl-12 h-12 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="glass-button bg-primary text-white border-primary/20 h-12 px-8"
                >
                  <Send className="w-4 h-4" />
                  <span>{createLoading ? "Publishing..." : "Publish Blog"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {blogs.length === 0 ? (
        <div className="glass-card py-20 text-center flex flex-col items-center gap-4">
          <p className="text-white/40 font-medium">No stories found yet.</p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-primary text-sm font-bold underline underline-offset-4"
            >
              Show all stories
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="glass-card group hover:bg-white/10 transition-all duration-500">
              <Link href={`/blog/${blog.id}`} className="block mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold group-hover:text-primary transition-colors leading-tight">
                    {blog.title}
                  </h2>
                  {blog.location && (
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/20 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                      <MapPin className="w-3 h-3 text-primary" />
                      {blog.location}
                    </span>
                  )}
                </div>
                <p className="text-white/60 leading-relaxed line-clamp-2">
                  {blog.preview}
                </p>
              </Link>

              {blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold text-primary/80 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(blog.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${blog.isLiked
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                      }`}
                  >
                    <Heart className={`w-4 h-4 ${blog.isLiked ? "fill-current" : ""}`} />
                    <span>{blog.likes}</span>
                  </button>

                  <button
                    onClick={() => handleWishlist(blog.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${blog.isWishlisted
                        ? "bg-primary/20 text-primary-400 border-primary/30 shadow-lg shadow-primary/10"
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-primary/10 hover:text-primary-400 hover:border-primary/20"
                      }`}
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-500 ${blog.isWishlisted ? "rotate-45" : ""}`} />
                    <span className="hidden sm:inline">{blog.isWishlisted ? "In Wishlist" : "Wishlist"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold mb-1">Explorer</p>
                    <p className="text-xs font-bold text-white/80">{blog.author}</p>
                  </div>
                  <Link
                    href={`/blog/${blog.id}`}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary group-hover:border-primary transition-all shadow-xl"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

