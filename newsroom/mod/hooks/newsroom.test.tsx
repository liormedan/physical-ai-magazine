import { expect, test } from 'claude-code/testing'

const STATUS = {
  server: 'up',
  today: { date: '2026-10-24', stage: 'check', url: null },
  agents: [{ key: 'reporter', title: 'כתב-חוקר', status: 'idle', spentUsd: 1.5, budgetUsd: 35 }],
  approvals: [{ id: 'a1', title: 'גיליון 2026-10-24 נפסל פעמיים' }],
  names: { lastRound: null, candidates: [] },
  error: null,
}

const PANE = {
  plugin: 'newsroom',
  component: 'Pane',
  requestId: 'newsroom',
  props: { title: 'חדר חדשות', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

function engine(on: any, { here }: { here: boolean }) {
  on('command.register', () => ({ value: { command: 'newsroom' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('fs.exists', () => ({ value: here }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: JSON.stringify(STATUS), stderr: '' } }))
  on('session.start', (_: unknown, e: any) => ({ cwd: e.cwd }))
}

test('in the project: the pane shows the stage, the approval and the team', async ($, on) => {
  engine(on, { here: true })
  await $.session.start({ cwd: 'C:/pysical ai magazine', surface: 'desktop', isInteractive: true })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /בדיקת עובדות/ }))?.text).toContain('בדיקת עובדות')
    expect((await ui.find({ type: 'Text', text: /נפסל פעמיים/ }))?.text).toContain('2026-10-24')
    expect((await ui.find({ type: 'Text', text: /כתב-חוקר/ }))?.text).toContain('$1.50 / $35')
    expect(await ui.find({ type: 'Button', key: 'approve-a1' })).toBeTruthy()
    await ui.unmount()
  }
})

test('in the project: the band says where today\'s issue is', async ($, on) => {
  engine(on, { here: true })
  await $.session.start({ cwd: 'C:/pysical ai magazine', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'newsroom', component: 'AbovePrompt', props: { hasSurvey: false }, surface: 'terminal' } as any)
  expect((await ui.find({ type: 'Text', text: /גיליון היום/ }))?.text).toBe('גיליון היום: בבדיקת עובדות · 1 ממתינים לאישורך')
  await ui.unmount()
})

test('outside the project: no band and the command says so', async ($, on) => {
  engine(on, { here: false })
  on('ui.render', ($: any, e: any) => { const { Text } = $.ui.resolve(e); return <Text>engine</Text> })
  await $.session.start({ cwd: 'C:/claude/gideon-makam', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'newsroom', component: 'AbovePrompt', props: { hasSurvey: false }, surface: 'terminal' } as any)
  expect(await ui.find({ type: 'Text', text: /גיליון היום/ })).toBeFalsy()
  await ui.unmount()
})
