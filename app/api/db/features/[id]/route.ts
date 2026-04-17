import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const feature = await prisma.feature.update({ where: { id: params.id }, data: body })
  return NextResponse.json(feature)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.feature.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
