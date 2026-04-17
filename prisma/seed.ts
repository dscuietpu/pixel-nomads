import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const now = new Date()

async function main() {
  // ── Documents ──────────────────────────────────────────────────────
  const doc1 = await prisma.document.create({
    data: {
      id: 'doc-1',
      title: 'AI-Powered Onboarding Flow — PRD',
      type: 'prd',
      tags: JSON.stringify(['onboarding', 'ai', 'growth']),
      content: `<h1>AI-Powered Onboarding Flow</h1>
<h2>Problem Statement</h2>
<p>New users struggle to understand the product's value within the first session, leading to a 62% drop-off before completing setup. The current static onboarding ignores user role, goals, and prior tool experience.</p>
<h2>Goals &amp; Success Metrics</h2>
<ul>
  <li>Activation rate (completes setup) | 38% → 60% | Q3 2026</li>
  <li>Time-to-first-value | 8 min → 4 min | Q3 2026</li>
  <li>Day-7 retention | 41% → 55% | Q3 2026</li>
</ul>
<h2>User Stories</h2>
<ul>
  <li>As a <strong>first-time user</strong>, I want the checklist to reflect my role so that I complete relevant steps only.</li>
  <li>As a <strong>returning user</strong>, I want to resume exactly where I left off so that I don't repeat completed steps.</li>
</ul>
<h2>Scope</h2>
<h3>In Scope</h3>
<ul><li>Role detection from sign-up form</li><li>Dynamic checklist generation</li><li>Progress persistence</li></ul>
<h3>Out of Scope</h3>
<ul><li>In-app video tutorials</li><li>Multi-language support</li></ul>
<h2>Functional Requirements</h2>
<ol>
  <li>System detects user role (PM / Engineer / Designer / Other) during sign-up</li>
  <li>Checklist renders 5–8 role-specific tasks within 500ms of login</li>
  <li>Progress syncs across devices in real time</li>
  <li>AI suggests next best action when user is idle for 2+ minutes</li>
</ol>
<h2>Open Questions</h2>
<ol>
  <li>Should we gate certain features behind checklist completion?</li>
  <li>How do we handle users who skip role selection?</li>
</ol>`,
      createdAt: now,
    },
  })

  await prisma.document.create({
    data: {
      id: 'doc-2',
      title: 'User Research: Activation Drop-off',
      type: 'research',
      tags: JSON.stringify(['research', 'activation', 'ux']),
      content: `<h1>User Research: Activation Drop-off</h1>
<h2>Research Summary</h2>
<p>20 moderated user interviews conducted across SMB and enterprise segments. Focus: where and why users abandon onboarding before completing setup.</p>
<h2>Key Themes</h2>
<h3>Theme 1: Onboarding Confusion</h3>
<p><strong>Frequency:</strong> 14 out of 20 participants</p>
<p><strong>Summary:</strong> Users couldn't identify what to do first. The flat list of tasks gave no sense of priority or sequence.</p>
<blockquote><p>"I didn't really know what to do first."</p></blockquote>
<blockquote><p>"There were too many options — I just closed it."</p></blockquote>
<h3>Theme 2: Email Re-engagement Works</h3>
<p><strong>Frequency:</strong> 9 out of 20 participants</p>
<p><strong>Summary:</strong> Users who received a follow-up email within 24 hours of sign-up were 3x more likely to return.</p>
<blockquote><p>"The reminder email was actually helpful."</p></blockquote>
<h2>Recommended Actions</h2>
<ol>
  <li>Redesign onboarding with role-based task ordering</li>
  <li>Add a 24-hour re-engagement email for users who didn't complete setup</li>
  <li>Add a progress indicator to the sidebar</li>
</ol>`,
      createdAt: now,
    },
  })

  await prisma.document.create({
    data: {
      id: 'doc-3',
      title: 'Q2 2026 Roadmap',
      type: 'roadmap',
      tags: JSON.stringify(['roadmap', 'q2', 'planning']),
      content: `<h1>Q2 2026 Product Roadmap</h1>
<h2>Strategic Theme</h2>
<p>Reduce time-to-value for new users while expanding power features for established teams.</p>
<h2>Now (April – May)</h2>
<ul>
  <li><strong>Smart Onboarding Checklist</strong> — personalised by role, reduces setup friction</li>
  <li><strong>Activation Email Sequence</strong> — automated drip for drop-off recovery</li>
</ul>
<h2>Next (June – July)</h2>
<ul>
  <li><strong>In-app Tooltip Coach</strong> — contextual AI guidance during complex workflows</li>
  <li><strong>Bulk CSV Import</strong> — enterprise teams need faster data migration</li>
</ul>
<h2>Later (August+)</h2>
<ul>
  <li><strong>Dark Mode</strong> — high-demand cosmetic feature</li>
  <li><strong>SSO / SAML</strong> — required for enterprise deals in pipeline</li>
</ul>
<h2>Dependencies &amp; Risks</h2>
<ul>
  <li>AI checklist depends on role-detection data model — must ship in April</li>
  <li>SSO blocked on security audit scheduled for July</li>
</ul>`,
      createdAt: now,
    },
  })

  await prisma.document.create({
    data: {
      id: 'doc-4',
      title: 'User Story: Onboarding Checklist',
      type: 'user-story',
      tags: JSON.stringify(['user-story', 'onboarding']),
      content: `<h2>User Story</h2>
<p><strong>As a</strong> first-time PM using the product<br>
<strong>I want to</strong> see a checklist tailored to my role<br>
<strong>So that</strong> I can complete setup quickly without wading through irrelevant steps.</p>
<h2>Acceptance Criteria</h2>
<pre><code>Scenario: PM role selected during sign-up
  Given the user selected "Product Manager" during registration
  When they log in for the first time
  Then the checklist shows PM-specific tasks
  And engineering-specific tasks are hidden

Scenario: Progress persists on refresh
  Given the user completed 3 of 6 checklist items
  When they refresh the page
  Then completed items remain checked
  And the progress bar reflects 50%</code></pre>
<h2>Story Points</h2>
<p>Estimate: <strong>5</strong> — requires role-detection integration + dynamic rendering logic</p>
<h2>Definition of Done</h2>
<ul>
  <li>Code reviewed and merged</li>
  <li>Acceptance criteria passing in staging</li>
  <li>Unit tests written for role-mapping logic</li>
  <li>QA sign-off on all 5 supported roles</li>
</ul>`,
      createdAt: now,
    },
  })

  // ── Features ───────────────────────────────────────────────────────
  await prisma.feature.createMany({
    data: [
      {
        id: 'feat-1',
        title: 'Smart Onboarding Checklist',
        description: 'Personalised checklist that adapts based on user role and goals detected during sign-up.',
        status: 'Now', priority: 'P0',
        reach: 5000, impact: 3, confidence: 80, effort: 2,
        riceScore: Math.round((5000 * 3 * 0.8) / 2),
        moscow: 'Must', assignee: 'Alice', dueDate: '2026-04-30', linkedDocId: 'doc-1',
      },
      {
        id: 'feat-2',
        title: 'In-app Tooltip Coach',
        description: 'Contextual tooltips powered by AI that guide users through complex workflows.',
        status: 'Next', priority: 'P1',
        reach: 3000, impact: 2, confidence: 70, effort: 3,
        riceScore: Math.round((3000 * 2 * 0.7) / 3),
        moscow: 'Should', assignee: 'Bob', dueDate: '2026-06-15', linkedDocId: 'doc-1',
      },
      {
        id: 'feat-3',
        title: 'Activation Email Sequence',
        description: 'Automated email drip triggered by key in-app actions to re-engage users who dropped off.',
        status: 'Now', priority: 'P1',
        reach: 8000, impact: 2, confidence: 90, effort: 1,
        riceScore: Math.round((8000 * 2 * 0.9) / 1),
        moscow: 'Must', assignee: 'Carol', dueDate: '2026-05-20', linkedDocId: null,
      },
      {
        id: 'feat-4',
        title: 'Bulk CSV Import',
        description: 'Allow enterprise teams to import existing data via CSV for faster migration.',
        status: 'Next', priority: 'P1',
        reach: 2500, impact: 3, confidence: 75, effort: 4,
        riceScore: Math.round((2500 * 3 * 0.75) / 4),
        moscow: 'Should', assignee: 'Dave', dueDate: '2026-07-01', linkedDocId: null,
      },
      {
        id: 'feat-5',
        title: 'Dark Mode',
        description: 'Full dark mode support across the application.',
        status: 'Later', priority: 'P3',
        reach: 2000, impact: 1, confidence: 95, effort: 2,
        riceScore: Math.round((2000 * 1 * 0.95) / 2),
        moscow: 'Could', assignee: '', dueDate: '', linkedDocId: null,
      },
      {
        id: 'feat-6',
        title: 'SSO / SAML Integration',
        description: 'Enterprise single sign-on support required for large account deals in the sales pipeline.',
        status: 'Later', priority: 'P2',
        reach: 1200, impact: 3, confidence: 60, effort: 5,
        riceScore: Math.round((1200 * 3 * 0.6) / 5),
        moscow: 'Must', assignee: 'Eve', dueDate: '2026-08-15', linkedDocId: null,
      },
      {
        id: 'feat-7',
        title: 'Progress Bar in Sidebar',
        description: 'Visual indicator of onboarding completion shown persistently in the left sidebar.',
        status: 'Now', priority: 'P2',
        reach: 5000, impact: 1, confidence: 90, effort: 1,
        riceScore: Math.round((5000 * 1 * 0.9) / 1),
        moscow: 'Should', assignee: 'Alice', dueDate: '2026-05-05', linkedDocId: 'doc-1',
      },
      {
        id: 'feat-8',
        title: 'Analytics Dashboard',
        description: 'PM-facing dashboard showing activation funnel metrics, drop-off points, and cohort retention.',
        status: 'Done', priority: 'P0',
        reach: 50, impact: 3, confidence: 100, effort: 3,
        riceScore: Math.round((50 * 3 * 1.0) / 3),
        moscow: 'Must', assignee: 'Bob', dueDate: '2026-03-31', linkedDocId: null,
      },
    ],
  })

  // ── Research Insights ──────────────────────────────────────────────
  await prisma.researchInsight.createMany({
    data: [
      {
        id: 'insight-1',
        theme: 'Onboarding Confusion',
        summary: 'Users struggle to understand the value proposition within the first session, leading to abandonment before completing setup.',
        quotes: JSON.stringify([
          "I didn't really know what to do first.",
          "There were too many options — I just closed it.",
          "I couldn't figure out if it was for me.",
        ]),
        frequency: 14,
        linkedFeatures: JSON.stringify(['feat-1', 'feat-2', 'feat-7']),
      },
      {
        id: 'insight-2',
        theme: 'Email Re-engagement Works',
        summary: 'Users who received a follow-up email within 24 hours of sign-up were 3x more likely to return and complete activation.',
        quotes: JSON.stringify([
          "The reminder email was actually helpful.",
          "I had forgotten about it until I got the email.",
        ]),
        frequency: 9,
        linkedFeatures: JSON.stringify(['feat-3']),
      },
      {
        id: 'insight-3',
        theme: 'Role-based Expectations',
        summary: 'Engineers and designers felt the default onboarding was built for PMs and found many steps irrelevant to their workflow.',
        quotes: JSON.stringify([
          "Half of these steps don't apply to me as a developer.",
          "Why is it asking me about roadmaps? I just want the API docs.",
        ]),
        frequency: 11,
        linkedFeatures: JSON.stringify(['feat-1']),
      },
    ],
  })

  // ── File Tree ──────────────────────────────────────────────────────
  await prisma.fileNode.create({
    data: {
      id: 'folder-1', name: 'Onboarding Project', type: 'folder',
      parentId: null, children: JSON.stringify(['doc-1', 'doc-2', 'doc-4']), createdAt: now,
    },
  })
  await prisma.fileNode.create({
    data: {
      id: 'folder-2', name: 'Planning', type: 'folder',
      parentId: null, children: JSON.stringify(['doc-3']), createdAt: now,
    },
  })
  await prisma.fileNode.createMany({
    data: [
      { id: 'doc-1', name: 'AI-Powered Onboarding Flow — PRD',  type: 'prd',        parentId: 'folder-1', children: '[]', createdAt: now },
      { id: 'doc-2', name: 'User Research: Activation Drop-off', type: 'research',   parentId: 'folder-1', children: '[]', createdAt: now },
      { id: 'doc-4', name: 'User Story: Onboarding Checklist',  type: 'user-story', parentId: 'folder-1', children: '[]', createdAt: now },
      { id: 'doc-3', name: 'Q2 2026 Roadmap',                   type: 'roadmap',    parentId: 'folder-2', children: '[]', createdAt: now },
    ],
  })

  console.log('✓ Seed complete')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
