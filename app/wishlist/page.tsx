"use client"

import { useState, useEffect } from "react"
import { Heart, Trash2 } from "lucide-react"
import Link from "next/link"
import { apiCall } from "@/lib/api"

interface WishlistItem {
  id: string
  title: string
  preview: string
  location?: string
  images: string[]
  addedDate: string
}

export default function Wishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await apiCall("/api/wishlist")

      if (!response) return

      if (response.ok) {
        const data = await response.json()
        setItems(data)
      } else {
        setError("Failed to fetch wishlist")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (blogId: string) => {
    try {
      const response = await apiCall(`/api/blogs/${blogId}/wishlist`, {
        method: "POST",
      })

      if (!response) return

      if (response.ok) {
        setItems(items.filter((item) => item.id !== blogId))
      }
    } catch (error) {
      console.error("Remove from wishlist error:", error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
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
          <button
            onClick={fetchWishlist}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-4">Start adding travel blogs to your wishlist from Discovery!</p>
          <Link
            href="/discovery"
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors inline-block"
          >
            Explore Blogs
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-3">
                <Link href={`/blog/${item.id}`} className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors">
                    {item.title}
                  </h2>
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">{item.preview}</p>
              {item.location && <p className="text-sm text-gray-500 mb-4">📍 {item.location}</p>}
              <div className="text-sm text-gray-500">Added on {new Date(item.addedDate).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
