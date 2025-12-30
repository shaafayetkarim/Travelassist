import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { completed, text } = await request.json()

    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))
    const userId = payload.id as string

    // Get todo item with trip info
    const todoItem = await prisma.todoItem.findUnique({
      where: { id },
      include: {
        trip: true,
      },
    })

    if (!todoItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 })
    }

    // Check if user is participant
    const participant = await prisma.tripParticipant.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId: todoItem.tripId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: "Not authorized to edit this todo" }, { status: 403 })
    }

    // Update todo item
    const updatedTodo = await prisma.todoItem.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(text !== undefined && { text }),
      },
    })

    return NextResponse.json(updatedTodo)
  } catch (error) {
    console.error("Update todo API error:", error)
    return NextResponse.json({ error: "Failed to update todo item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Get todo item with trip info
    const todoItem = await prisma.todoItem.findUnique({
      where: { id },
      include: {
        trip: true,
      },
    })

    if (!todoItem) {
      return NextResponse.json({ error: "Todo item not found" }, { status: 404 })
    }

    // Check if user is participant
    const participant = await prisma.tripParticipant.findUnique({
      where: {
        userId_tripId: {
          userId,
          tripId: todoItem.tripId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({ error: "Not authorized to delete this todo" }, { status: 403 })
    }

    // Delete todo item
    await prisma.todoItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Todo item deleted successfully" })
  } catch (error) {
    console.error("Delete todo API error:", error)
    return NextResponse.json({ error: "Failed to delete todo item" }, { status: 500 })
  }
}
