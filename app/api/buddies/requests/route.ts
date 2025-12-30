

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    const { receiverId } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 })
    }

    if (userId === receiverId) {
      return NextResponse.json({ error: "Cannot send buddy request to yourself" }, { status: 400 })
    }

    // Check if request already exists
    const existingRequest = await prisma.buddyRequest.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: userId,
          receiverId,
        },
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: "Buddy request already sent" }, { status: 400 })
    }

    // Create buddy request
    const buddyRequest = await prisma.buddyRequest.create({
      data: {
        requesterId: userId,
        receiverId,
      },
      include: {
        requester: {
          select: {
            name: true,
          },
        },
        receiver: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(buddyRequest)
  } catch (error) {
    console.error("Buddy request API error:", error)
    return NextResponse.json({ error: "Failed to send buddy request" }, { status: 500 })
  }
}

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

    // Get accepted buddy requests (both sent and received)
    const buddyRequests = await prisma.buddyRequest.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true,
            interests: true,
            _count: {
              select: {
                trips: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true,
            interests: true,
            _count: {
              select: {
                trips: true,
              },
            },
          },
        },
      },
    })

    const buddies = buddyRequests.map((request) => {
      const buddy = request.requesterId === userId ? request.receiver : request.requester
      return {
        id: buddy.id,
        name: buddy.name,
        avatar: buddy.avatar || "/placeholder.svg",
        location: buddy.location || "Location not set",
        rating: 4.5 + Math.random() * 0.5, // Mock rating for now
        tripsCompleted: buddy._count.trips,
        interests: buddy.interests ? buddy.interests.split(",").map((i) => i.trim()) : [],
        matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score
      }
    })

    const uniqueBuddies = buddies.filter((buddy, index, self) => index === self.findIndex((b) => b.id === buddy.id))

    return NextResponse.json(uniqueBuddies)
  } catch (error) {
    console.error("My buddies API error:", error)
    return NextResponse.json({ error: "Failed to fetch buddies" }, { status: 500 })
  }
}

