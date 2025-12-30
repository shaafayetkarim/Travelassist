


import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

async function auth(req: Request) {
  const bearer = req.headers.get('authorization') || ''
  const headerToken = bearer.startsWith('Bearer ') ? bearer.slice(7) : ''
  const cookieToken = cookies().get('token')?.value || ''
  const token = headerToken || cookieToken
  if (!token) return null
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret)
  const id = (payload.sub as string) || (payload.id as string)
  if (!id) return null
  return { id }
}

export async function GET(req: Request) {
  const me = await auth(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId: me.id } } },
    orderBy: { updatedAt: 'desc' },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  return NextResponse.json({ chats })
}

export async function POST(req: Request) {
  const me = await auth(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberIds, name } = (await req.json()) as { memberIds: string[]; name?: string }
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: 'memberIds required' }, { status: 400 })
  }

  const uniqueIds = Array.from(new Set([me.id, ...memberIds]))
  const isGroup = uniqueIds.length > 2

  if (!isGroup) {
    const existing = await prisma.chat.findFirst({
      where: { isGroup: false, members: { every: { userId: { in: uniqueIds } } } },
      select: { id: true },
    })
    if (existing) return NextResponse.json({ chatId: existing.id })
  }

  const chat = await prisma.chat.create({
    data: {
      name: name?.trim() || null,
      isGroup,
      members: { create: uniqueIds.map((uid) => ({ userId: uid })) },
    },
    select: { id: true },
  })

  return NextResponse.json({ chatId: chat.id })
}
