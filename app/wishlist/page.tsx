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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-white/5 rounded-2xl w-1/4 border border-white/10"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-40 animate-pulse" />
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
          <button onClick={fetchWishlist} className="glass-button bg-primary text-white border-primary/20">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-12">Your Wishlist</h1>

      {items.length === 0 ? (
        <div className="glass-card py-20 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Heart className="w-10 h-10 text-white/20" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Your wishlist is empty</h2>
            <p className="text-white/40 max-w-xs mx-auto">Start adding travel stories to your collection from Discovery.</p>
          </div>
          <Link
            href="/discovery"
            className="glass-button bg-primary text-white border-primary/20 shadow-lg shadow-primary/20"
          >
            Explore Stories
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => (
            <div key={item.id} className="glass-card group hover:bg-white/10 transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                <Link href={`/blog/${item.id}`} className="flex-1">
                  <h2 className="text-xl font-bold group-hover:text-primary transition-colors leading-tight">
                    {item.title}
                  </h2>
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/60 mb-6 line-clamp-2 leading-relaxed">{item.preview}</p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                {item.location && (
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/40 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    {item.location}
                  </span>
                )}
                <div className="text-[10px] uppercase tracking-widest font-bold text-white/20">
                  Added {new Date(item.addedDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

