import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const filter = searchParams.get("filter") || "all"

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { type: "CUSTOMER" },
          search
            ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
            : {},
          filter === "premium" ? { isPremium: true } : filter === "regular" ? { isPremium: false } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        isPremium: true,
        createdAt: true,
        _count: {
          select: {
            trips: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      type: "customer",
      isPremium: user.isPremium,
      joinDate: user.createdAt,
      tripsCompleted: user._count.trips,
      status: "active",
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
