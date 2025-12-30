

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

interface BuddyRequestUser {
  id: string
  name: string
  avatar: string
  location: string
  bio: string
  rating: number
  tripsCompleted: number
  interests: string[]
}

interface FormattedRequest {
  id: string
  type: "incoming" | "outgoing"
  user: BuddyRequestUser
  createdAt: Date
  status: string
}

export async function GET(request: Request) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Fetch incoming buddy requests (requests sent TO the current user)
    const incomingRequests = await prisma.buddyRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true,
            bio: true,
            interests: true,
            _count: { select: { trips: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch outgoing buddy requests (requests sent BY the current user)
    const outgoingRequests = await prisma.buddyRequest.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            location: true,
            bio: true,
            interests: true,
            _count: { select: { trips: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Format incoming requests
    const formattedIncoming: FormattedRequest[] = incomingRequests.map((request) => ({
      id: request.id,
      type: "incoming",
      user: formatUser(request.requester),
      createdAt: request.createdAt,
      status: request.status,
    }))

    // Format outgoing requests
    const formattedOutgoing: FormattedRequest[] = outgoingRequests.map((request) => ({
      id: request.id,
      type: "outgoing",
      user: formatUser(request.receiver),
      createdAt: request.createdAt,
      status: request.status,
    }))

    return NextResponse.json({
      success: true,
      incoming: formattedIncoming,
      outgoing: formattedOutgoing,
      incomingCount: formattedIncoming.length,
      outgoingCount: formattedOutgoing.length,
    })
  } catch (error) {
    console.error("Fetch pending requests error:", error)

    if (error instanceof Error && error.name.includes("JWT")) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: "Failed to fetch pending requests",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}

// Helper function to format user data
function formatUser(user: any): BuddyRequestUser {
  return {
    id: user.id,
    name: user.name || "Unknown User",
    avatar: user.avatar || "/placeholder.svg?height=40&width=40",
    location: user.location || "Location not specified",
    bio: user.bio || "No bio available",
    rating: 4.5, // Fixed rating for consistency
    tripsCompleted: user._count?.trips || 0,
    interests: user.interests
      ? user.interests
          .split(",")
          .map((interest: string) => interest.trim())
          .filter(Boolean)
      : [],
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { action } = await request.json()

    // Extract and verify JWT token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (!["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'accept', 'decline', or 'cancel'" }, { status: 400 })
    }

    // Find the buddy request
    const buddyRequest = await prisma.buddyRequest.findUnique({
      where: { id },
    })

    if (!buddyRequest) {
      return NextResponse.json({ error: "Buddy request not found" }, { status: 404 })
    }

    if (action === "cancel") {
      // Check if user is the requester (only requester can cancel)
      if (buddyRequest.requesterId !== userId) {
        return NextResponse.json({ error: "You can only cancel requests you sent" }, { status: 403 })
      }

      // Check if request is still pending
      if (buddyRequest.status !== "PENDING") {
        return NextResponse.json({ error: "Cannot cancel a request that has already been processed" }, { status: 400 })
      }

      // Delete the request
      await prisma.buddyRequest.delete({
        where: { id },
      })

      return NextResponse.json({
        success: true,
        message: "Buddy request canceled successfully",
      })
    }

    // Check if user is the receiver (only receiver can accept/decline)
    if (buddyRequest.receiverId !== userId) {
      return NextResponse.json({ error: "You can only accept/decline requests sent to you" }, { status: 403 })
    }

    // Check if request is still pending
    if (buddyRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request has already been processed" }, { status: 400 })
    }

    // Update the request status
    const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED"
    const updatedRequest = await prisma.buddyRequest.update({
      where: { id },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      message: `Buddy request ${action}ed successfully`,
      request: updatedRequest,
    })
  } catch (error) {
    console.error("Update buddy request error:", error)

    if (error instanceof Error && error.name.includes("JWT")) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: "Failed to update buddy request",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Extract and verify JWT token
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as string

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Find the buddy request
    const buddyRequest = await prisma.buddyRequest.findUnique({
      where: { id },
    })

    if (!buddyRequest) {
      return NextResponse.json({ error: "Buddy request not found" }, { status: 404 })
    }

    // Check if user is the requester (only requester can cancel)
    if (buddyRequest.requesterId !== userId) {
      return NextResponse.json({ error: "You can only cancel requests you sent" }, { status: 403 })
    }

    // Check if request is still pending
    if (buddyRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Cannot cancel a request that has already been processed" }, { status: 400 })
    }

    // Delete the request
    await prisma.buddyRequest.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Buddy request canceled successfully",
    })
  } catch (error) {
    console.error("Cancel buddy request error:", error)

    if (error instanceof Error && error.name.includes("JWT")) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: "Failed to cancel buddy request",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 },
    )
  }
}
