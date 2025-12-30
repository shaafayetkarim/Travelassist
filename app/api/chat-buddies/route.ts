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

  const accepted = await prisma.buddyRequest.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: me.id }, { receiverId: me.id }],
    },
    select: { requesterId: true, receiverId: true },
  })

  const otherIds = Array.from(
    new Set(accepted.map((r) => (r.requesterId === me.id ? r.receiverId : r.requesterId)))
  )

  const users = await prisma.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, email: true, avatar: true },
  })

  return NextResponse.json({ buddies: users })
}
