import type { ResearchInsight } from '@/lib/types'

export const mockInsights: ResearchInsight[] = [
  {
    id: 'insight-1',
    theme: 'Onboarding Confusion',
    summary: 'Users cannot identify the first meaningful action to take. The flat task list gives no sense of priority or role relevance — 14 of 20 participants abandoned setup before reaching their first "aha" moment.',
    quotes: [
      "I didn't really know what to do first. Everything looked equally important.",
      "There were too many options — I just closed it and came back later. Then never did.",
      "I couldn't figure out if it was built for someone like me.",
      "I'm a designer, not a PM. Half these steps felt irrelevant.",
    ],
    frequency: 14,
    linkedFeatures: ['feat-1', 'feat-2', 'feat-7'],
  },
  {
    id: 'insight-2',
    theme: 'Email Re-engagement Works',
    summary: 'Users who received a contextual follow-up email within 24 hours of sign-up were 3× more likely to return and complete activation. The key was specificity — generic "come back!" emails had no effect, but emails referencing the exact step they stopped at worked.',
    quotes: [
      "The reminder email was actually helpful — it told me exactly what I hadn't finished.",
      "I had completely forgotten about it until I got that email.",
      "It felt like the product actually knew where I was. That was impressive.",
    ],
    frequency: 9,
    linkedFeatures: ['feat-3'],
  },
  {
    id: 'insight-3',
    theme: 'Role-Based Expectation Mismatch',
    summary: 'Engineers and designers felt the default onboarding was built exclusively for PMs. Steps like "set up your roadmap" and "define your OKRs" felt irrelevant or presumptuous to non-PM personas, creating an immediate sense that the product wasn\'t for them.',
    quotes: [
      "Half of these steps don't apply to me. I just write code — why is it asking me about roadmaps?",
      "Why is it asking me about OKRs? I just want the API docs.",
      "It assumed I was a product manager from step one. I'm a designer.",
      "I completed the engineering steps in 3 minutes but there were 9 more 'PM steps' I had to skip.",
    ],
    frequency: 11,
    linkedFeatures: ['feat-1'],
  },
  {
    id: 'insight-4',
    theme: 'Collaboration is the Unlock',
    summary: 'Users who invited at least one teammate within their first session had 4× higher 30-day retention than solo users. However, the invite flow is buried — only 3 of 20 participants found it without prompting. When shown, 16 said they would have used it immediately.',
    quotes: [
      "Oh, you can invite people? I had no idea. I would have done that on day one.",
      "The whole point is to use it with my team. Working alone in here feels pointless.",
      "I tried to find a share button and gave up. Turns out it was in settings, which I never open.",
      "Once my team was in here with me, I used it every day. Before that, barely at all.",
    ],
    frequency: 16,
    linkedFeatures: ['feat-1', 'feat-7'],
  },
  {
    id: 'insight-5',
    theme: 'Progress Visibility Drives Completion',
    summary: 'Users with a visible progress indicator completed onboarding at a 2.4× higher rate than those without. Even a simple "3 of 7 steps complete" label was enough to trigger completion behaviour. Users described incomplete progress indicators as a motivational trigger they couldn\'t ignore.',
    quotes: [
      "I'm the kind of person who needs to finish things. Seeing 4 of 7 done made me want to finish.",
      "The progress bar made it feel achievable. Without it, it just looked like an endless list.",
      "I actually went back specifically to get to 100%. That's embarrassing but true.",
    ],
    frequency: 12,
    linkedFeatures: ['feat-7'],
  },
  {
    id: 'insight-6',
    theme: 'Power Users Want Keyboard-First',
    summary: 'Among users who stayed past day 14, 78% reported wanting keyboard shortcuts for core actions. They described mouse-heavy workflows as "slow" and "not built for people who live in their keyboard". This segment also had the highest NPS scores (+67) — suggesting keyboard support is a key driver of advocacy.',
    quotes: [
      "I live in my keyboard. Every time I have to reach for the mouse I lose flow.",
      "Cmd+K for everything is table stakes for any serious tool in 2025.",
      "I'd recommend this to my whole team if it had proper keyboard nav. Right now I keep it to myself.",
      "The lack of shortcuts is the one thing stopping me from switching from Notion.",
    ],
    frequency: 8,
    linkedFeatures: ['feat-2'],
  },
]
