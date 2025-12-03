


import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import { sendTripCreationEmail } from '@/lib/mailer';

export async function GET(request: Request) {
  try {
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

    // Get public trips that user can join
    const trips = await prisma.trip.findMany({
      where: {
        isPublic: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
        participants: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            }
          : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedTrips = trips.map((trip) => ({
      id: trip.id,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
      description: trip.description,
      maxParticipants: trip.maxParticipants,
      creator: {
        id: trip.creator.id,
        name: trip.creator.name,
        avatar: trip.creator.avatar,
      },
      participantCount: trip._count.participants,
      participants: currentUserId
        ? trip.participants.map((p) => ({
            id: p.user.id,
            name: p.user.name,
            avatar: p.user.avatar,
            role: p.role.toLowerCase(),
            joinedAt: p.joinedAt,
          }))
        : [],
      isParticipant: currentUserId ? trip.participants.length > 0 : false,
      createdAt: trip.createdAt,
    }))

    return NextResponse.json({ trips: formattedTrips })
  } catch (error) {
    console.error("Trips API error:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

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

    const { destination, startDate, endDate, budget, description, isPublic, maxParticipants } = await request.json()

    if (!destination || !startDate || !endDate || !budget) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const maxParticipantsNum = maxParticipants ? Number.parseInt(maxParticipants.toString(), 10) : 6

    if (maxParticipantsNum < 2 || maxParticipantsNum > 20) {
      return NextResponse.json({ error: "Max participants must be between 2 and 20" }, { status: 400 })
    }

    // Create trip with creator details included
    const trip = await prisma.trip.create({
      data: {
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        budget,
        description: description || "",
        isPublic: isPublic ?? true,
        maxParticipants: maxParticipantsNum,
        creatorId: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true, // Include email for sending notification
          },
        },
      },
    })

    // Add creator as participant
    await prisma.tripParticipant.create({
      data: {
        userId,
        tripId: trip.id,
        role: "CREATOR",
      },
    })

    // Send email notification
    try {
      await sendTripCreationEmail(
        trip.creator.email, 
        trip.creator.name, 
        trip.description,
        
      );
      console.log('Trip creation email sent successfully to:', trip.creator.email);
    } catch (emailError) {
      console.error('Failed to send trip creation email:', emailError);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json({ trip: { id: trip.id } })
  } catch (error) {
    console.error("Create trip API error:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}