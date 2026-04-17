import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.document.findMany({ orderBy: { createdAt: 'asc' } })
  const docs = rows.map((d) => ({ ...d, tags: JSON.parse(d.tags) }))
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const doc = await prisma.document.create({
    data: {
      id:        body.id,
      title:     body.title,
      content:   body.content,
      type:      body.type,
      tags:      JSON.stringify(body.tags ?? []),
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
    },
  })
  return NextResponse.json({ ...doc, tags: JSON.parse(doc.tags) })
}
