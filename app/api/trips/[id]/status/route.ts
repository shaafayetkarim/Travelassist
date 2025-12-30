import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyJWT } from "@/lib/jwt"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { status } = await request.json()

    if (!["OPEN", "ONGOING", "ENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Check if user is the trip creator
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      select: { creatorId: true },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }


    // Update trip status
    const updatedTrip = await prisma.trip.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, status: true },
    })

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
    })
  } catch (error) {
    console.error("Error updating trip status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
