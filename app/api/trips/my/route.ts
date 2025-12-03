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

    // Get trips where user is creator or participant
    const trips = await prisma.trip.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
            todoItems: true,
          },
        },
        todoItems: {
          select: {
            completed: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedTrips = trips.map((trip) => {
      const userParticipant = trip.participants.find((p) => p.userId === userId)
      const completedTodos = trip.todoItems.filter((todo) => todo.completed).length
      const totalTodos = trip._count.todoItems

      return {
        id: trip.id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        description: trip.description,
        isPublic: trip.isPublic,
        maxParticipants: trip.maxParticipants,
        status: trip.status,
        creator: {
          id: trip.creator.id,
          name: trip.creator.name,
          avatar: trip.creator.avatar,
        },
        participants: trip.participants.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          avatar: p.user.avatar,
          role: p.role.toLowerCase(),
          joinedAt: p.joinedAt,
        })),
        participantCount: trip._count.participants,
        userRole: userParticipant?.role.toLowerCase() || "participant",
        isCreator: trip.creatorId === userId,
        progress: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
        todoStats: {
          completed: completedTodos,
          total: totalTodos,
        },
        createdAt: trip.createdAt,
      }
    })

    // Separate trips by status and user role
    const createdTrips = formattedTrips.filter((trip) => trip.isCreator)
    const joinedTrips = formattedTrips.filter((trip) => !trip.isCreator)
    const upcomingTrips = formattedTrips.filter((trip) => new Date(trip.startDate) > new Date())
    const ongoingTrips = formattedTrips.filter((trip) => {
      const now = new Date()
      return new Date(trip.startDate) <= now && new Date(trip.endDate) >= now
    })
    const completedTrips = formattedTrips.filter((trip) => new Date(trip.endDate) < new Date())

    return NextResponse.json({
      trips: formattedTrips,
      categories: {
        created: createdTrips,
        joined: joinedTrips,
        upcoming: upcomingTrips,
        ongoing: ongoingTrips,
        completed: completedTrips,
      },
      stats: {
        total: formattedTrips.length,
        created: createdTrips.length,
        joined: joinedTrips.length,
        upcoming: upcomingTrips.length,
        ongoing: ongoingTrips.length,
        completed: completedTrips.length,
      },
    })
  } catch (error) {
    console.error("My trips API error:", error)
    return NextResponse.json({ error: "Failed to fetch your trips" }, { status: 500 })
  }
}
