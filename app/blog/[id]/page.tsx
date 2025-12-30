"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Heart, Plus, Calendar, MapPin, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { apiCall } from "@/lib/api"

interface BlogData {
  id: string
  title: string
  content: string
  preview: string
  author: string
  publishDate: string
  location?: string
  likes: number
  isLiked: boolean
  isWishlisted: boolean
  images: string[]
  tags: string[]
}

export default function BlogDetails() {
  const params = useParams()
  const blogId = params.id as string
  const [blog, setBlog] = useState<BlogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (blogId) {
      fetchBlog()
    }
  }, [blogId])

  const fetchBlog = async () => {
    try {
      setLoading(true)
      const response = await apiCall(`/api/blogs/${blogId}`)

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setBlog(data)
      } else {
        setError("Blog not found")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!blog) return

    try {
      const response = await apiCall(`/api/blogs/${blog.id}/like`, {
        method: "POST",
      })

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setBlog({
          ...blog,
          isLiked: data.isLiked,
          likes: data.likes,
        })
      }
    } catch (error) {
      console.error("Like error:", error)
    }
  }

  const handleWishlist = async () => {
    if (!blog) return

    try {
      const response = await apiCall(`/api/blogs/${blog.id}/wishlist`, {
        method: "POST",
      })

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setBlog({
          ...blog,
          isWishlisted: data.isWishlisted,
        })
      }
    } catch (error) {
      console.error("Wishlist error:", error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
            <div className="w-full h-64 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Blog not found"}</h1>
          <Link href="/discovery" className="text-primary-600 hover:text-primary-700">
            Return to Discovery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/discovery" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Discovery
      </Link>

      {/* Blog header */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
        {blog.images && blog.images[0] && (
          <img src={blog.images[0] || "/placeholder.svg"} alt={blog.title} className="w-full h-64 object-cover" />
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {blog.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(blog.publishDate).toLocaleDateString()}
            </div>
            {blog.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {blog.location}
              </div>
            )}
          </div>

          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag) => (
                <span key={tag} className="bg-primary-100 text-primary-700 text-sm px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                blog.isLiked ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <Heart className={`w-4 h-4 ${blog.isLiked ? "fill-current" : ""}`} />
              <span>{blog.likes}</span>
            </button>

            <button
              onClick={handleWishlist}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                blog.isWishlisted
                  ? "bg-primary-50 text-primary-600"
                  : "bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{blog.isWishlisted ? "Added to Wishlist" : "Add to Wishlist"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blog content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
      </div>
    </div>
  )
}
