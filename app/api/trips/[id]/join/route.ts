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

    // Check if trip exists and is public
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (!trip.isPublic) {
      return NextResponse.json({ error: "Trip is not public" }, { status: 403 })
    }

    if (trip._count.participants >= trip.maxParticipants) {
      return NextResponse.json({ error: "Trip is full" }, { status: 400 })
    }

    // Check if already a participant
    const existingParticipant = await prisma.tripParticipant.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId: id,
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json({ error: "Already a participant" }, { status: 400 })
    }

    // Add as participant
    await prisma.tripParticipant.create({
      data: {
        userId,
        tripId: id,
        role: "PARTICIPANT",
      },
    })

    return NextResponse.json({ message: "Successfully joined trip" })
  } catch (error) {
    console.error("Join trip API error:", error)
    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 })
  }
}
