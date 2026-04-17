import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const insight = await prisma.researchInsight.update({
    where: { id: params.id },
    data: {
      ...(body.theme          !== undefined && { theme:          body.theme }),
      ...(body.summary        !== undefined && { summary:        body.summary }),
      ...(body.quotes         !== undefined && { quotes:         JSON.stringify(body.quotes) }),
      ...(body.frequency      !== undefined && { frequency:      body.frequency }),
      ...(body.linkedFeatures !== undefined && { linkedFeatures: JSON.stringify(body.linkedFeatures) }),
    },
  })
  return NextResponse.json({
    ...insight,
    quotes:         JSON.parse(insight.quotes),
    linkedFeatures: JSON.parse(insight.linkedFeatures),
  })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.researchInsight.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
