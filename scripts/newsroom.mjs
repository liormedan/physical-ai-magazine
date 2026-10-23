// The newsroom CLI: runs the project's own Paperclip server and drives the
// agent team defined in newsroom/company.json. The newsroom mod
// (.claude/skills/newsroom) only calls this script; it works from a terminal too.
//
// Paperclip needs Node 24; it runs through `npx -p node@24`, so the machine's
// Node is never changed. All Paperclip state lives in newsroom/.paperclip.
//
// Usage: node scripts/newsroom.mjs <command>
//   start | stop | status [--json] | setup | issue
//   approve <id> | reject <id> | pause <agent> | resume <agent> | names
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'newsroom', '.paperclip');
const pidFile = join(dataDir, 'server.pid');
const logFile = join(dataDir, 'server.log');
const idsFile = join(dataDir, 'ids.json');
const config = JSON.parse(readFileSync(join(root, 'newsroom', 'company.json'), 'utf8'));
const API = 'http://127.0.0.1:3100/api'; // the server binds IPv4 only; localhost may resolve to ::1
const SITE = 'https://physical-ai-magazine.vercel.app';
const isWin = process.platform === 'win32';

const ROLE = { editor: 'ceo', reporter: 'researcher', checker: 'qa', publisher: 'general', brand: 'designer', developer: 'engineer' };
const ICON = { editor: 'crown', reporter: 'search', checker: 'microscope', publisher: 'globe', brand: 'wand', developer: 'code' };
const cents = (usd) => Math.round(usd * 100);

// ---- HTTP ----------------------------------------------------------------

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}
async function isUp() {
  try { return (await fetch(`${API}/health`, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}
const list = (x) => (Array.isArray(x) ? x : x?.items ?? x?.data ?? []);
const loadIds = () => (existsSync(idsFile) ? JSON.parse(readFileSync(idsFile, 'utf8')) : { agents: {}, routines: {} });
const saveIds = (ids) => writeFileSync(idsFile, JSON.stringify(ids, null, 2));

// ---- server --------------------------------------------------------------

async function start() {
  if (await isUp()) return 'השרת כבר פעיל';
  if (!existsSync(join(dataDir, 'instances', 'default', 'config.json')))
    throw new Error('Paperclip not onboarded here yet: npx -y -p node@24 -p paperclipai@latest paperclipai onboard --yes --data-dir newsroom/.paperclip');
  mkdirSync(dataDir, { recursive: true });
  // Agents inherit the server's environment. Started from inside Claude Code
  // (the mod, the desktop app), that carries the host session's CLAUDE_* and
  // ANTHROPIC_* variables, which make a child `claude` expect the host to
  // handle its auth; drop them so agents use the CLI's own sign-in.
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(CLAUDE|ANTHROPIC)/.test(k)));
  Object.assign(env, { PAPERCLIP_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' });
  const cmd = `npx -y -p node@24 -p paperclipai@latest paperclipai run --data-dir "${dataDir}"`;
  let pid;
  if (isWin) {
    // A process that outlives this script, the mod and the Claude Code session.
    // It must own a console, hidden: a console-less (detached) server makes every
    // process its agents start (each `claude`, each hook's `node`) open a new
    // visible console window. Start-Process -WindowStyle Hidden gives the server
    // one hidden console that the whole tree inherits.
    const launcher = join(dataDir, 'server.cmd');
    writeFileSync(launcher, `@echo off\r\ncd /d "${root}"\r\n${cmd} >> "${logFile}" 2>&1\r\n`);
    const ps = `(Start-Process -FilePath cmd.exe -ArgumentList '/d','/c','"${launcher}"' -WindowStyle Hidden -PassThru).Id`;
    pid = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', env, windowsHide: true }).trim();
  } else {
    const log = openSync(logFile, 'a');
    const child = spawn('sh', ['-c', cmd], { cwd: root, detached: true, stdio: ['ignore', log, log], env });
    child.unref();
    pid = child.pid;
  }
  writeFileSync(pidFile, String(pid));
  for (let i = 0; i < 90; i++) {
    if (await isUp()) return `השרת עלה (pid ${pid})`;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`the server did not answer within 3 minutes; see ${logFile}`);
}

function killTree(pid) {
  try {
    if (isWin) execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    else process.kill(-pid, 'SIGTERM');
    return true;
  } catch { return false; }
}

async function stop() {
  const pid = existsSync(pidFile) ? Number(readFileSync(pidFile, 'utf8')) : null;
  if (pid) killTree(pid);
  rmSync(pidFile, { force: true });
  if (await isUp() && isWin) {
    // started some other way (onboard, a terminal): stop whatever listens on 3100
    const out = execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' });
    const line = out.split('\n').find((l) => /127\.0\.0\.1:3100\s.*LISTENING/.test(l));
    const owner = line?.trim().split(/\s+/).pop();
    if (owner) killTree(owner);
  }
  return (await isUp()) ? 'השרת עדיין פעיל — עצור אותו ידנית' : 'השרת נעצר';
}

// ---- setup (idempotent) ----------------------------------------------------

async function findCompany() {
  return list(await api('GET', '/companies')).find((c) => c.name === config.company.name) ?? null;
}

async function setup() {
  if (!(await isUp())) throw new Error('השרת כבוי — /newsroom start');
  const ids = loadIds();
  const log = [];

  let company = await findCompany();
  if (!company) {
    company = await api('POST', '/companies', { name: config.company.name, description: config.company.goal, budgetMonthlyCents: cents(config.company.monthlyBudgetUsd) });
    log.push('נוצרה חברה');
  } else {
    await api('PATCH', `/companies/${company.id}/budgets`, { budgetMonthlyCents: cents(config.company.monthlyBudgetUsd) });
  }
  ids.companyId = company.id;

  const goals = list(await api('GET', `/companies/${company.id}/goals`));
  let goal = goals.find((g) => g.title === config.company.goal);
  if (!goal) { goal = await api('POST', `/companies/${company.id}/goals`, { title: config.company.goal, level: 'company', status: 'active' }); log.push('נוצרה מטרה'); }
  ids.goalId = goal.id;

  const existing = list(await api('GET', `/companies/${company.id}/agents`));
  // managers first so reportsTo can point at an id
  for (const a of [...config.agents].sort((x, y) => (x.reportsTo === null ? -1 : 0) - (y.reportsTo === null ? -1 : 0))) {
    const adapterConfig = { cwd: config.defaults.cwd, maxTurnsPerRun: 150, timeoutSec: 3600 };
    const body = {
      name: a.name, title: a.title, role: ROLE[a.key] ?? 'general', icon: ICON[a.key] ?? 'bot',
      reportsTo: a.reportsTo ? ids.agents[a.reportsTo] : undefined,
      capabilities: `See ${a.instructions}`,
      adapterType: config.defaults.adapter, adapterConfig,
      budgetMonthlyCents: cents(a.monthlyBudgetUsd),
    };
    let agent = existing.find((x) => x.name === a.name);
    if (!agent) { agent = await api('POST', `/companies/${company.id}/agents`, body); log.push(`נוצר סוכן: ${a.title}`); }
    else {
      const { name, ...patch } = body;
      await api('PATCH', `/agents/${agent.id}`, patch);
      await api('PATCH', `/agents/${agent.id}/budgets`, { budgetMonthlyCents: cents(a.monthlyBudgetUsd) });
    }
    ids.agents[a.key] = agent.id;
    await api('PATCH', `/agents/${agent.id}/instructions-path`, { path: join(root, a.instructions) });
    const current = (await api('GET', `/agents/${agent.id}`)).status;
    if (a.status === 'paused' && current !== 'paused') await api('POST', `/agents/${agent.id}/pause`, {});
    if (a.status === 'active' && current === 'paused') await api('POST', `/agents/${agent.id}/resume`, {});
  }

  const routines = list(await api('GET', `/companies/${company.id}/routines`));
  for (const r of config.routines) {
    let routine = routines.find((x) => x.title === r.title);
    if (!routine) {
      routine = await api('POST', `/companies/${company.id}/routines`, {
        title: r.title, description: r.description, assigneeAgentId: ids.agents[r.assignee], goalId: ids.goalId,
        priority: 'high', status: r.status ?? 'active', concurrencyPolicy: 'skip_if_active', catchUpPolicy: 'enqueue_missed_with_cap',
      });
      await api('POST', `/routines/${routine.id}/triggers`, { kind: 'schedule', cronExpression: r.cron, timezone: 'Asia/Jerusalem', label: r.cron });
      log.push(`נוצרה שגרה: ${r.title} (${r.cron}, ${r.status ?? 'active'})`);
    } else {
      if (routine.status !== (r.status ?? 'active')) log.push(`שגרה ${r.title}: ${routine.status} → ${r.status ?? 'active'}`);
      await api('PATCH', `/routines/${routine.id}`, { description: r.description, assigneeAgentId: ids.agents[r.assignee], status: r.status ?? 'active' });
    }
    ids.routines[r.key] = routine.id;
  }

  saveIds(ids);
  return log.length ? log.join('\n') : 'הכול כבר מעודכן';
}

// ---- actions ---------------------------------------------------------------

async function issue() {
  const id = loadIds().routines['daily-issue'];
  if (!id) throw new Error('אין שגרת גיליון — /newsroom setup');
  await api('POST', `/routines/${id}/run`, { source: 'manual', idempotencyKey: `daily-issue-${today()}` });
  return 'גיליון היום הופעל';
}
async function decide(kind, id) {
  if (!id) throw new Error(`usage: ${kind} <id>`);
  await api('POST', `/approvals/${id}/${kind}`, { decisionNote: 'via newsroom mod' });
  return kind === 'approve' ? 'אושר' : 'נדחה';
}
async function pause(kind, key) {
  const id = loadIds().agents[key];
  if (!id) throw new Error(`סוכן לא מוכר: ${key}. אפשר: ${config.agents.map((a) => a.key).join(', ')}`);
  await api('POST', `/agents/${id}/${kind}`, {});
  return `${config.agents.find((a) => a.key === key).title}: ${kind === 'pause' ? 'הושהה' : 'חודש'}`;
}

// ---- status ------------------------------------------------------------------

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date());

function stageOf(date) {
  if (existsSync(join(root, 'data', 'issues', `${date}.json`))) return 'published';
  const check = join(root, 'newsroom', 'drafts', `${date}.check.md`);
  if (existsSync(check)) return /VERDICT:\s*PASS/.test(readFileSync(check, 'utf8')) ? 'publish' : 'failed';
  if (existsSync(join(root, 'newsroom', 'drafts', `${date}.json`))) return 'check';
  return null;
}

function names() {
  const file = join(root, 'newsroom', 'naming', 'candidates.md');
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const rounds = [...text.matchAll(/^## (.+)$/gm)];
  if (!rounds.length) return { lastRound: null, candidates: [] };
  const last = rounds.at(-1);
  const body = text.slice(last.index);
  const candidates = [...body.matchAll(/^\|\s*\d+\s*\|\s*\*{0,2}([^|*]+?)\*{0,2}\s*\|/gm)].map((m) => m[1].trim()).slice(0, 3);
  return { lastRound: last[1].trim(), candidates };
}

async function status() {
  const date = today();
  const out = {
    server: 'down', today: { date, stage: stageOf(date) ?? 'not-started', url: null },
    agents: config.agents.map((a) => ({ key: a.key, title: a.title, status: 'unknown', spentUsd: null, budgetUsd: a.monthlyBudgetUsd })),
    approvals: [], names: names(), error: null,
  };
  if (out.today.stage === 'published') out.today.url = `${SITE}/issues/${date}`;
  if (!(await isUp())) return out;
  out.server = 'up';
  try {
    const ids = loadIds();
    if (!ids.companyId) { out.error = 'הצוות עוד לא הוקם — /newsroom setup'; out.agents = []; return out; }
    const agents = list(await api('GET', `/companies/${ids.companyId}/agents`));
    out.agents = config.agents.map((a) => {
      const x = agents.find((y) => y.id === ids.agents[a.key]);
      const spent = x?.spentMonthlyCents ?? x?.budget?.spentMonthlyCents;
      return { key: a.key, title: a.title, status: x?.status ?? 'unknown', spentUsd: spent != null ? spent / 100 : null, budgetUsd: a.monthlyBudgetUsd };
    });
    const approvals = list(await api('GET', `/companies/${ids.companyId}/approvals`));
    out.approvals = approvals.filter((p) => p.status === 'pending').map((p) => ({ id: p.id, title: p.title ?? p.summary ?? p.type ?? p.id }));
    if (out.today.stage === 'not-started') {
      const issues = list(await api('GET', `/companies/${ids.companyId}/issues`));
      if (issues.some((i) => i.title?.includes('גיליון היום') && (i.createdAt ?? '').startsWith(date))) out.today.stage = 'research';
    }
  } catch (e) { out.error = e.message.slice(0, 200); }
  return out;
}

function printStatus(s) {
  const lines = [
    `שרת: ${s.server === 'up' ? 'פעיל' : 'כבוי'}`,
    `גיליון ${s.today.date}: ${s.today.stage}${s.today.url ? ` · ${s.today.url}` : ''}`,
    ...s.agents.map((a) => `  ${a.title}: ${a.status}${a.spentUsd != null ? ` · $${a.spentUsd.toFixed(2)}/$${a.budgetUsd}` : ''}`),
    `ממתינים לאישור: ${s.approvals.length}`,
    ...s.approvals.map((a) => `  ${a.id} · ${a.title}`),
    `שמות: ${s.names.lastRound ? `${s.names.lastRound} — ${s.names.candidates.join(' · ')}` : 'אין סבב חדש'}`,
  ];
  if (s.error) lines.push(`שגיאה: ${s.error}`);
  return lines.join('\n');
}

// ---- main ------------------------------------------------------------------

const [cmd, arg] = process.argv.slice(2);
try {
  let out;
  if (cmd === 'start') out = await start();
  else if (cmd === 'stop') out = await stop();
  else if (cmd === 'status') { const s = await status(); out = arg === '--json' ? JSON.stringify(s) : printStatus(s); }
  else if (cmd === 'setup') out = await setup();
  else if (cmd === 'issue') out = await issue();
  else if (cmd === 'approve' || cmd === 'reject') out = await decide(cmd, arg);
  else if (cmd === 'pause' || cmd === 'resume') out = await pause(cmd, arg);
  else if (cmd === 'names') {
    const n = names();
    out = `בריף: newsroom/naming/BRIEF.md\n${n.lastRound ? `סבב אחרון: ${n.lastRound} — ${n.candidates.join(' · ')}` : 'עוד אין סבב חדש; מעצב ומותג מציע בימי ראשון ב-10:00'}`;
  } else { console.error('usage: node scripts/newsroom.mjs start|stop|status [--json]|setup|issue|approve <id>|reject <id>|pause <agent>|resume <agent>|names'); process.exit(2); }
  console.log(out);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
