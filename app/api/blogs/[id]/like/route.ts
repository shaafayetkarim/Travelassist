import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId: id,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_blogId: {
            userId,
            blogId: id,
          },
        },
      })
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          blogId: id,
        },
      })
    }

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { blogId: id },
    })

    return NextResponse.json({
      isLiked: !existingLike,
      likes: likeCount,
    })
  } catch (error) {
    console.error("Like API error:", error)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
