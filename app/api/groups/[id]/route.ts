

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        posts: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        creator: group.creator,
        posts: group.posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          location: post.location,
          postDate: post.postDate,
          author: post.author,
          createdAt: post.createdAt,
        })),
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    })
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch group" }, { status: 500 })
  }
}
