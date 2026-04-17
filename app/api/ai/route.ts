import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { getSystemPrompt } from '@/lib/prompts'
import type { AIWorkflow } from '@/lib/types'

export const runtime = 'edge'

const client = new OpenAI()

interface RequestBody {
  workflow: AIWorkflow
  userMessage: string
  documentContext?: string
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
}

export async function POST(req: NextRequest) {
  let body: RequestBody

  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const { workflow = 'general', userMessage, documentContext, conversationHistory = [] } = body

  if (!userMessage?.trim()) {
    return new Response('userMessage is required', { status: 400 })
  }

  const systemPrompt = getSystemPrompt(workflow, documentContext)

  const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  const stream = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages,
    stream: true,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
