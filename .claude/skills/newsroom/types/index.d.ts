// What `node scripts/newsroom.mjs status --json` prints; the mod only reads it.
export type Stage = 'not-started' | 'research' | 'check' | 'failed' | 'publish' | 'published'

export type AgentRow = {
  key: string
  title: string
  status: 'active' | 'running' | 'idle' | 'paused' | 'error' | 'unknown'
  spentUsd: number | null
  budgetUsd: number | null
}

export type Approval = { id: string; title: string }

export type NewsroomStatus = {
  server: 'up' | 'down'
  today: { date: string; stage: Stage; url: string | null }
  agents: AgentRow[]
  approvals: Approval[]
  names: { lastRound: string | null; candidates: string[] }
  error: string | null
}

declare module 'claude-code' {
  interface PluginState {
    newsroom: {
      status: NewsroomStatus | null
      // false outside this project: the mod stays silent there
      isProject: boolean
    }
  }
}
