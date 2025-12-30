


import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: groupId } = params

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
    }

    const posts = await prisma.groupPost.findMany({
      where: { groupId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      location: post.location,
      postDate: post.postDate,
      author: post.author,
      createdAt: post.createdAt,
    }))

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
    })
  } catch (error) {
    console.error("Error fetching group posts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization header required" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    let payload
    try {
      const result = await jwtVerify(token, secret)
      payload = result.payload
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const userId = payload.id as string

    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid token: no user ID" }, { status: 401 })
    }

    const { id: groupId } = params
    const { title, content, location, postDate } = await request.json()

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 })
    }

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
    }

    const post = await prisma.groupPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        location: location?.trim() || null,
        postDate: postDate ? new Date(postDate) : new Date(),
        authorId: userId,
        groupId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        location: post.location,
        postDate: post.postDate,
        author: post.author,
        createdAt: post.createdAt,
      },
    })
  } catch (error) {
    console.error("Error creating group post:", error)
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 })
  }
}
