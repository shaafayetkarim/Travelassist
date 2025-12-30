import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { ObjectId } from 'bson'

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const me = await auth(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chatId = params.id
  if (!ObjectId.isValid(chatId)) return NextResponse.json({ error: 'Invalid chat id' }, { status: 400 })

  const member = await prisma.chatMember.findFirst({ where: { chatId, userId: me.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const after = searchParams.get('after')
  const where = after ? { chatId, createdAt: { gt: new Date(after) } } : { chatId }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true } } },
    take: 200,
  })

  return NextResponse.json({ messages, now: new Date().toISOString() })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const me = await auth(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const chatId = params.id
  const { content } = (await req.json()) as { content: string }
  if (!content?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const member = await prisma.chatMember.findFirst({ where: { chatId, userId: me.id } })
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const msg = await prisma.message.create({
    data: { chatId, senderId: me.id, content: content.trim() },
  })

  await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } })

  return NextResponse.json({ id: msg.id })
}
