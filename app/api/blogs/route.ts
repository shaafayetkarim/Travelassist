

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    let currentUserId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
        currentUserId = payload.id as string
      } catch (error) {
        // Token invalid, continue without user context
      }
    }

    const blogs = await prisma.blog.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { preview: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        author: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
        likes: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
            }
          : false,
        wishlists: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
            }
          : false,
      },
      orderBy: {
        publishDate: "desc",
      },
    })

    const formattedBlogs = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      preview: blog.preview,
      location: blog.location,
      tags: blog.tags,
      images: blog.images,
      publishDate: blog.publishDate,
      author: blog.author.name,
      likes: blog._count.likes,
      isLiked: currentUserId ? blog.likes.length > 0 : false,
      isWishlisted: currentUserId ? blog.wishlists.length > 0 : false,
    }))

    return NextResponse.json(formattedBlogs)
  } catch (error) {
    console.error("Blogs API error:", error)
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    const body = await request.json()
    const { title, content, location, publishDate } = body

    // Validation
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    // Create blog post
    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        preview: content.trim().substring(0, 200) + (content.length > 200 ? "..." : ""),
        location: location?.trim() || null,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        authorId: userId,
        tags: [], // Default empty tags
        images: [], // Default empty images
        isPremium: false, // Default to public blog
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    })

    const formattedBlog = {
      id: blog.id,
      title: blog.title,
      preview: blog.preview,
      location: blog.location,
      tags: blog.tags,
      images: blog.images,
      publishDate: blog.publishDate,
      author: blog.author.name,
      likes: blog._count.likes,
      isLiked: false,
      isWishlisted: false,
    }

    return NextResponse.json(formattedBlog, { status: 201 })
  } catch (error) {
    console.error("Create blog error:", error)
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 })
  }
}
