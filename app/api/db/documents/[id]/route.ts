import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const doc = await prisma.document.update({
    where: { id: params.id },
    data: {
      ...(body.title   !== undefined && { title:   body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.type    !== undefined && { type:    body.type }),
      ...(body.tags    !== undefined && { tags:    JSON.stringify(body.tags) }),
    },
  })
  return NextResponse.json({ ...doc, tags: JSON.parse(doc.tags) })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.document.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
