

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // optional: current user (not strictly needed for this response)
    const authHeader = request.headers.get("authorization")
    let currentUserId: string | null = null
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET || "")
        )
        currentUserId = (payload.id as string) ?? null
      } catch {}
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true /* avatar if you have it */ } },
          },
        },
        todoItems: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            text: true,
            completed: true,
            createdBy: true,   // make sure this exists in your schema
            createdAt: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // IMPORTANT: include status and serialize dates to string
    const formattedTrip = {
      id: trip.id,
      destination: trip.destination,
      startDate: trip.startDate?.toISOString?.() ?? String(trip.startDate),
      endDate: trip.endDate?.toISOString?.() ?? String(trip.endDate),
      budget: String(trip.budget), // your component expects string
      description: trip.description ?? "",
      isPublic: trip.isPublic,
      maxParticipants: trip.maxParticipants,
      status: trip.status,                         // <-- add this
      createdAt: trip.createdAt?.toISOString?.() ?? String(trip.createdAt),

      creator: trip.creator.name,
      creatorId: trip.creator.id,

      participants: trip.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        role: p.role.toLowerCase(),
        // avatar: p.user.avatar ?? undefined,         // if you have it
        joinedAt: p.createdAt?.toISOString?.() ?? undefined, // depends on your model: participant.createdAt
      })),

      todoItems: trip.todoItems.map((t) => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        createdBy: t.createdBy,
        createdAt: t.createdAt.toISOString(),
      })),
    }

    return NextResponse.json(formattedTrip)
  } catch (error) {
    console.error("Trip details API error:", error)
    return NextResponse.json({ error: "Failed to fetch trip details" }, { status: 500 })
  }
}
