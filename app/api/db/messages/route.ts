import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const messages = await prisma.aIMessage.findMany({ orderBy: { timestamp: 'asc' } })
  return NextResponse.json(messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const msg = await prisma.aIMessage.create({
    data: {
      id:        body.id,
      role:      body.role,
      content:   body.content,
      workflow:  body.workflow,
      timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
    },
  })
  return NextResponse.json({ ...msg, timestamp: msg.timestamp.toISOString() })
}

export async function DELETE(req: NextRequest) {
  const { workflow } = await req.json().catch(() => ({}))
  if (workflow) {
    await prisma.aIMessage.deleteMany({ where: { workflow } })
  } else {
    await prisma.aIMessage.deleteMany()
  }
  return NextResponse.json({ ok: true })
}
