import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { text } = await request.json()

    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    // Check if user is participant
    const participant = await prisma.tripParticipant.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId: id,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: "Not a participant of this trip" }, { status: 403 })
    }

    // Create todo item
    const todoItem = await prisma.todoItem.create({
      data: {
        text,
        tripId: id,
        createdBy: userId,
      },
    })

    return NextResponse.json(todoItem)
  } catch (error) {
    console.error("Create todo API error:", error)
    return NextResponse.json({ error: "Failed to create todo item" }, { status: 500 })
  }
}
