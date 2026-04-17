import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.fileNode.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(rows.map((n) => ({ ...n, children: JSON.parse(n.children) })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const node = await prisma.fileNode.create({
    data: {
      id:        body.id,
      name:      body.name,
      type:      body.type,
      parentId:  body.parentId ?? null,
      children:  JSON.stringify(body.children ?? []),
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
    },
  })
  return NextResponse.json({ ...node, children: JSON.parse(node.children) })
}
