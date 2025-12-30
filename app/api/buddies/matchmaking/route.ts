import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const currentUserId = payload.id as string

    // Get current user's likes and wishlists
    const currentUserLikes = await prisma.like.findMany({
      where: { userId: currentUserId },
      select: { blogId: true },
    })

    const currentUserWishlists = await prisma.wishlist.findMany({
      where: { userId: currentUserId },
      select: { blogId: true },
    })

    const currentUserBlogIds = [
      ...currentUserLikes.map((like) => like.blogId),
      ...currentUserWishlists.map((wishlist) => wishlist.blogId),
    ]

    if (currentUserBlogIds.length === 0) {
      // If user has no likes or wishlists, return empty array
      return NextResponse.json([])
    }

    // Get all users except current user and existing buddies
    const existingBuddies = await prisma.buddyRequest.findMany({
      where: {
        OR: [
          { requesterId: currentUserId, status: "ACCEPTED" },
          { receiverId: currentUserId, status: "ACCEPTED" },
        ],
      },
      select: {
        requesterId: true,
        receiverId: true,
      },
    })

    const buddyIds = existingBuddies.map((buddy) =>
      buddy.requesterId === currentUserId ? buddy.receiverId : buddy.requesterId,
    )

    const users = await prisma.user.findMany({
      where: {
        AND: [{ id: { not: currentUserId } }, { id: { notIn: buddyIds } }, { type: "CUSTOMER" }],
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
    })

    // Check each user for matches based on likes and wishlists
    const matchedUsers = []

    for (const user of users) {
      // Get user's likes and wishlists
      const userLikes = await prisma.like.findMany({
        where: { userId: user.id },
        select: { blogId: true },
      })

      const userWishlists = await prisma.wishlist.findMany({
        where: { userId: user.id },
        select: { blogId: true },
      })

      const userBlogIds = [...userLikes.map((like) => like.blogId), ...userWishlists.map((wishlist) => wishlist.blogId)]

      // Check for common blogs
      const commonBlogs = currentUserBlogIds.filter((blogId) => userBlogIds.includes(blogId))

      // If there are common blogs, it's a match
      if (commonBlogs.length > 0) {
        matchedUsers.push({
          id: user.id,
          name: user.name,
          avatar: user.avatar || "/placeholder.svg",
          location: "Location not set",
          rating: 4.5 + Math.random() * 0.5, // Keep rating for now
          tripsCompleted: user._count.trips,
          interests: user.interests ? user.interests.split(",").map((i) => i.trim()) : [],
          isMatch: true,
          commonInterests: commonBlogs.length,
        })
      }
    }

    // Sort by number of common interests (highest first)
    matchedUsers.sort((a, b) => b.commonInterests - a.commonInterests)

    return NextResponse.json(matchedUsers)
  } catch (error) {
    console.error("Matchmaking API error:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}
