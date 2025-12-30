import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            preview: true,
            location: true,
            images: true,
            publishDate: true,
          },
        },
      },
      orderBy: {
        addedAt: "desc",
      },
    })

    const formattedWishlists = wishlists.map((wishlist) => ({
      id: wishlist.blog.id,
      title: wishlist.blog.title,
      preview: wishlist.blog.preview,
      location: wishlist.blog.location,
      images: wishlist.blog.images,
      addedDate: wishlist.addedAt,
    }))

    return NextResponse.json(formattedWishlists)
  } catch (error) {
    console.error("Wishlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}
