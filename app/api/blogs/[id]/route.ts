import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

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

    const blog = await prisma.blog.findUnique({
      where: { id },
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
    })

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    const formattedBlog = {
      id: blog.id,
      title: blog.title,
      content: blog.content,
      preview: blog.preview,
      location: blog.location,
      tags: blog.tags,
      images: blog.images,
      publishDate: blog.publishDate,
      author: blog.author.name,
      likes: blog._count.likes,
      isLiked: currentUserId ? blog.likes.length > 0 : false,
      isWishlisted: currentUserId ? blog.wishlists.length > 0 : false,
    }

    return NextResponse.json(formattedBlog)
  } catch (error) {
    console.error("Blog API error:", error)
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 })
  }
}
