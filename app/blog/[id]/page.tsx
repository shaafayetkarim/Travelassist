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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-6 bg-white/5 rounded-full w-32 border border-white/10"></div>
          <div className="glass-card h-[400px]" />
          <div className="glass-card h-96" />
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="glass-card border-red-500/20 py-16">
          <h1 className="text-3xl font-black tracking-tight mb-6">{error || "Chronicle Missing"}</h1>
          <Link href="/discovery" className="glass-button bg-white text-black border-transparent px-8 h-12 inline-flex">
            Return to Discovery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Back button */}
      <Link href="/discovery" className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-primary transition-colors mb-10">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Exploration
      </Link>

      {/* Blog header */}
      <div className="glass-card p-0 overflow-hidden mb-12 border-primary/10">
        {blog.images && blog.images[0] && (
          <div className="relative h-[400px] group">
            <img src={blog.images[0] || "/placeholder.svg"} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-60" />

            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {blog.tags.map((tag) => (
                  <span key={tag} className="bg-primary/20 backdrop-blur-md text-primary text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">{blog.title}</h1>
            </div>
          </div>
        )}

        <div className="p-8">
          {!blog.images?.[0] && (
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-8 leading-tight">{blog.title}</h1>
          )}

          <div className="flex flex-wrap items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-10 pb-8 border-b border-white/5">
            <div className="flex items-center group">
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:border-primary/50 transition-colors">
                <User className="w-3.5 h-3.5 text-white/60" />
              </div>
              {blog.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {new Date(blog.publishDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {blog.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-secondary" />
                {blog.location}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-3 h-12 px-6 rounded-2xl transition-all duration-300 font-bold text-sm ${blog.isLiked
                  ? "bg-red-500 text-white shadow-xl shadow-red-500/20"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Heart className={`w-4 h-4 ${blog.isLiked ? "fill-current" : ""}`} />
              <span>{blog.likes} Hearts</span>
            </button>

            <button
              onClick={handleWishlist}
              className={`flex items-center gap-3 h-12 px-6 rounded-2xl transition-all duration-300 font-bold text-sm border ${blog.isWishlisted
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Plus className={`w-4 h-4 transition-transform duration-500 ${blog.isWishlisted ? 'rotate-45' : ''}`} />
              <span>{blog.isWishlisted ? "In Sanctuary" : "Add to Sanctuary"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Blog content */}
      <article className="glass-card p-10 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 blur-[100px] -ml-32 -mb-32 rounded-full" />

        <div
          className="prose prose-invert prose-lg max-w-none relative z-10 
            prose-headings:font-black prose-headings:tracking-tight 
            prose-p:text-white/70 prose-p:leading-relaxed 
            prose-strong:text-white prose-strong:font-black
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-3xl prose-img:border prose-img:border-white/10"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>
    </div>
  )
}

