import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.name     !== undefined) data.name     = body.name
  if (body.parentId !== undefined) data.parentId = body.parentId
  if (body.children !== undefined) data.children = JSON.stringify(body.children)

  const updated = await prisma.fileNode.update({ where: { id: params.id }, data })
  return NextResponse.json({ ...updated, children: JSON.parse(updated.children) })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.fileNode.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
