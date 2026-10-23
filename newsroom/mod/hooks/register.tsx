import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { NewsroomStatus, Stage } from '../types'

// The newsroom cockpit for this project's Paperclip team. All the work is in
// `scripts/newsroom.mjs`; this mod only runs it and draws what it reports.
// It lives in the project's .claude/skills/, and stays silent in any session
// whose folder has no newsroom/company.json.

const PANE = 'newsroom'
const TITLE = 'חדר חדשות'
const CLI = ['node', 'scripts/newsroom.mjs']
const POLL_MS = 30_000

const status = atom({ plugin: 'newsroom', key: 'status' } as const, null)
const isProject = atom({ plugin: 'newsroom', key: 'isProject' } as const, false)

const STAGES: { stage: Stage; he: string }[] = [
  { stage: 'research', he: 'מחקר וכתיבה' },
  { stage: 'check', he: 'בדיקת עובדות' },
  { stage: 'publish', he: 'עריכה ופרסום' },
  { stage: 'published', he: 'באוויר' },
]
const STAGE_HE: Record<Stage, string> = {
  'not-started': 'עוד לא התחיל',
  research: 'במחקר וכתיבה',
  check: 'בבדיקת עובדות',
  failed: 'נפסל בבדיקה',
  publish: 'בעריכה ופרסום',
  published: 'פורסם',
}
const AGENT_HE: Record<string, string> = {
  active: 'פעיל', running: 'עובד עכשיו', idle: 'ממתין', paused: 'מושהה', error: 'תקלה', unknown: 'לא ידוע',
}

const COMMANDS = 'start · stop · issue · approve <id> · reject <id> · pause <agent> · resume <agent> · names · setup'

async function cli($: EngineInterface, args: string[], timeoutMs = 60_000) {
  const { exitCode, stdout, stderr } = await $.process.run([...CLI, ...args], { timeoutMs })
  return { ok: exitCode === 0, out: (stdout || stderr).trim() }
}

async function refresh($: EngineInterface) {
  const { ok, out } = await cli($, ['status', '--json'], 20_000).catch(() => ({ ok: false, out: '' }))
  let next: NewsroomStatus | null = null
  if (ok) {
    try { next = JSON.parse(out) as NewsroomStatus } catch { next = null }
  }
  await update($, status, () => next)
}

async function runAndToast($: EngineInterface, args: string[]) {
  const { out } = await cli($, args)
  $.ui.toast(out || 'בוצע')
  await refresh($)
}

export const register: Register = on => {
  let timer: { cancel: () => void } | null = null

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    const here = await $.fs.exists('newsroom/company.json').catch(() => false)
    await update($, isProject, () => here)
    if (!here) return started

    await $.command.register({
      name: 'newsroom',
      description: 'חדר החדשות של המגזין: חלונית, ושליטה בצוות הסוכנים',
    })
    await refresh($)
    timer = $.clock.every(POLL_MS, () => { void refresh($) })
    return started
  })

  on('session.end', async ($, e, next) => {
    timer?.cancel()
    timer = null
    return next(e)
  })

  on('command.run', { command: 'newsroom' }, async ($, e) => {
    if (!(await read($, isProject))) return { text: 'חדר החדשות קיים רק בתיקיית המגזין.' }
    const [sub = '', ...rest] = e.args.trim().split(/\s+/).filter(Boolean)

    if (sub === '') {
      await $.ui.open({ id: PANE, title: TITLE })
      await refresh($)
      return { text: 'חלונית חדר החדשות נפתחה.' }
    }
    if (!['start', 'stop', 'issue', 'approve', 'reject', 'pause', 'resume', 'names', 'setup'].includes(sub)) {
      return { text: `פקודה לא מוכרת. אפשר: ${COMMANDS}` }
    }
    // start may download Paperclip on first run; setup talks to the API many times
    const long = sub === 'start' || sub === 'setup'
    const { ok, out } = await cli($, [sub, ...rest], long ? 600_000 : 60_000)
    await refresh($)
    return { text: ok ? out || 'בוצע.' : `נכשל: ${out}` }
  })

  // a short line above the prompt; nothing outside the project or before the first read
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, status)
    if (!(await read($, isProject)) || e.props.hasSurvey || s === null) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const waiting = s.approvals.length
    return (
      <Box>
        <Text dimColor>
          {s.server === 'down'
            ? 'חדר חדשות: השרת כבוי (/newsroom start)'
            : `גיליון היום: ${STAGE_HE[s.today.stage]}${waiting ? ` · ${waiting} ממתינים לאישורך` : ''}`}
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const s = await read($, status)

    if (s === null) {
      return (
        <Box flexDirection="column">
          <Text dimColor>טוען את מצב חדר החדשות…</Text>
        </Box>
      )
    }

    const run = (args: string[]) => runAndToast($, args)
    const reached = (stage: Stage) =>
      STAGES.findIndex(x => x.stage === stage) <= STAGES.findIndex(x => x.stage === s.today.stage)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text bold>שרת</Text>
          {s.server === 'up'
            ? <Text>פעיל · localhost:3100</Text>
            : (
              <Box gap={1}>
                <Text>כבוי</Text>
                <Button key="start" label="הפעל" onPress={() => run(['start'])} />
              </Box>
            )}
          {s.error && <Text dimColor>{s.error}</Text>}
        </Box>

        <Box flexDirection="column">
          <Text bold>גיליון היום · {s.today.date}</Text>
          {s.today.stage === 'failed'
            ? <Text>נפסל בבדיקת העובדות — חזר לכתב</Text>
            : STAGES.map(x => (
              <Text dimColor={!reached(x.stage) || s.today.stage === 'not-started'}>
                {reached(x.stage) && s.today.stage !== 'not-started' ? '●' : '○'} {x.he}
              </Text>
            ))}
          {s.today.url && <Text>{s.today.url}</Text>}
          {s.server === 'up' && s.today.stage === 'not-started' && (
            <Button key="issue" label="הפעל את גיליון היום" onPress={() => run(['issue'])} />
          )}
        </Box>

        <Box flexDirection="column">
          <Text bold>ממתין לך</Text>
          {s.approvals.length === 0 && <Text dimColor>אין אישורים פתוחים</Text>}
          {s.approvals.map(a => (
            <Box flexDirection="column">
              <Text>{a.title}</Text>
              <Box gap={1}>
                <Button key={`approve-${a.id}`} label="אשר" onPress={() => run(['approve', a.id])} />
                <Button key={`reject-${a.id}`} label="דחה" onPress={() => run(['reject', a.id])} />
              </Box>
            </Box>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold>הצוות</Text>
          {s.agents.length === 0 && <Text dimColor>{s.server === 'up' ? 'אין סוכנים — /newsroom setup' : 'זמין כשהשרת פעיל'}</Text>}
          {s.agents.map(a => (
            <Text dimColor={a.status === 'paused'}>
              {a.title} · {AGENT_HE[a.status] ?? a.status}
              {a.budgetUsd !== null ? ` · $${(a.spentUsd ?? 0).toFixed(2)} / $${a.budgetUsd}` : ''}
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold>שמות</Text>
          {s.names.lastRound === null
            ? <Text dimColor>עוד אין סבב חדש · מעצב ומותג מציע בימי ראשון</Text>
            : <Text>{s.names.lastRound}: {s.names.candidates.join(' · ')}</Text>}
        </Box>
      </Box>
    )
  })
}
