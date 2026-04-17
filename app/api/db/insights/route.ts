import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.researchInsight.findMany()
  return NextResponse.json(rows.map((r) => ({
    ...r,
    quotes:         JSON.parse(r.quotes),
    linkedFeatures: JSON.parse(r.linkedFeatures),
  })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const insight = await prisma.researchInsight.create({
    data: {
      id:             body.id,
      theme:          body.theme,
      summary:        body.summary,
      quotes:         JSON.stringify(body.quotes ?? []),
      frequency:      body.frequency,
      linkedFeatures: JSON.stringify(body.linkedFeatures ?? []),
    },
  })
  return NextResponse.json({
    ...insight,
    quotes:         JSON.parse(insight.quotes),
    linkedFeatures: JSON.parse(insight.linkedFeatures),
  })
}
