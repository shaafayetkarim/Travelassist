import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { isPremium } = await request.json()

    // Get current user from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || ""))

    // Check if user is admin
    if (payload.type !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Update user premium status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isPremium },
      select: {
        id: true,
        name: true,
        email: true,
        isPremium: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Update user API error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
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

    // Check if user is admin
    if (payload.type !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user API error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
