import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { jwtVerify } from "jose"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const groups = await prisma.group.findMany({
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
            posts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      groups,
    })
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch groups" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization header required" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    let userId: string
    try {
      const { payload } = await jwtVerify(token, secret)
      console.log("JWT Payload:", payload) // Debug log
      userId = (payload.id as string) || (payload.userId as string) || (payload.sub as string)

      if (!userId) {
        console.error("No userId found in JWT payload:", payload)
        return NextResponse.json({ success: false, error: "Invalid token: no user ID" }, { status: 401 })
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Group name is required" }, { status: 400 })
    }

    // Check if group name already exists
    const existingGroup = await prisma.group.findUnique({
      where: { name: name.trim() },
    })

    if (existingGroup) {
      return NextResponse.json({ success: false, error: "Group name already exists" }, { status: 400 })
    }

    console.log("Creating group with userId:", userId) // Debug log

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        creatorId: userId,
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
            posts: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      group,
    })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ success: false, error: "Failed to create group" }, { status: 500 })
  }
}
