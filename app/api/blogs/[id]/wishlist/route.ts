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

    // Check if already wishlisted
    const existingWishlist = await prisma.wishlist.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId: id,
        },
      },
    })

    if (existingWishlist) {
      // Remove from wishlist
      await prisma.wishlist.delete({
        where: {
          userId_blogId: {
            userId,
            blogId: id,
          },
        },
      })
    } else {
      // Add to wishlist
      await prisma.wishlist.create({
        data: {
          userId,
          blogId: id,
        },
      })
    }

    return NextResponse.json({
      isWishlisted: !existingWishlist,
    })
  } catch (error) {
    console.error("Wishlist API error:", error)
    return NextResponse.json({ error: "Failed to toggle wishlist" }, { status: 500 })
  }
}
