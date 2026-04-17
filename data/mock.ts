import type { ResearchInsight } from '@/lib/types'

export const mockInsights: ResearchInsight[] = [
  {
    id: 'insight-1',
    theme: 'Onboarding Confusion',
    summary: 'Users struggle to understand the value proposition within the first session, leading to abandonment before completing setup.',
    quotes: [
      "I didn't really know what to do first.",
      "There were too many options — I just closed it.",
      "I couldn't figure out if it was for me.",
    ],
    frequency: 14,
    linkedFeatures: ['feat-1', 'feat-2'],
  },
  {
    id: 'insight-2',
    theme: 'Email Re-engagement Works',
    summary: 'Users who received a follow-up email within 24 hours of sign-up were 3x more likely to return and complete activation.',
    quotes: [
      "The reminder email was actually helpful.",
      "I had forgotten about it until I got the email.",
    ],
    frequency: 9,
    linkedFeatures: ['feat-3'],
  },
]
