


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
        // Token invalid
      }
    }

    // Get all users except current user
    const users = await prisma.user.findMany({
      where: {
        AND: [
          currentUserId ? { id: { not: currentUserId } } : {},
          { type: "CUSTOMER" },
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { interests: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        interests: true,
        isPremium: true,
        _count: {
          select: {
            trips: true,
          },
        },
      },
      take: 20,
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar || "/placeholder.svg",
      location: "Location not set", // You can add location field to User model
      rating: 4.5 + Math.random() * 0.5, // Keep rating for now
      tripsCompleted: user._count.trips,
      interests: user.interests ? user.interests.split(",").map((i) => i.trim()) : [],
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Buddies API error:", error)
    return NextResponse.json({ error: "Failed to fetch buddies" }, { status: 500 })
  }
}
