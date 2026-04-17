import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const features = await prisma.feature.findMany()
  return NextResponse.json(features)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const feature = await prisma.feature.create({ data: body })
  return NextResponse.json(feature)
}
