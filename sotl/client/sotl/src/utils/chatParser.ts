import type { ParsedCommand } from '../models/chatbox';

export function parseChatCommand(
  input: string
):
  | { ok: true; cmd: ParsedCommand }
  | { ok: false; error: string } {
  const t = input.trim();

  if (/^commands$/i.test(t)) return { ok: true, cmd: { kind: 'HELP' } };
  if (/^projects$/i.test(t)) return { ok: true, cmd: { kind: 'PROJECTS' } };

  if (/^reset$/i.test(t)) return { ok: true, cmd: { kind: 'PROJECT_ID_SET', projectId: '' } };

  if (/^\d+$/.test(t)) {
    return { ok: true, cmd: { kind: 'SELECT_PROJECT', index: Number(t) } };
  }

  if (/^select\s+\d+$/i.test(t)) {
    return { ok: true, cmd: { kind: 'SELECT_PROJECT', index: Number(t.split(/\s+/)[1]) } };
  }

  if (/^projectid\s+/i.test(t)) {
    return { ok: true, cmd: { kind: 'PROJECT_ID_SET', projectId: t.replace(/^projectid\s+/i, '').trim() } };
  }

  if (/^team$/i.test(t)) return { ok: true, cmd: { kind: 'TEAM' } };
  if (/^members$/i.test(t)) return { ok: true, cmd: { kind: 'MEMBERS' } }; // ✅ ADD
  if (/^my$/i.test(t)) return { ok: true, cmd: { kind: 'MY' } };

  // "undo" without parameters → show list
  if (/^undo$/i.test(t)) return { ok: true, cmd: { kind: 'UNDO_LIST' } };
  // "undo <taskId>" → direct undo (internal use)
  if (/^undo\s+/i.test(t)) return { ok: true, cmd: { kind: 'UNDO', taskId: t.split(/\s+/)[1] } };
  
  if (/^progress\s+/i.test(t)) return { ok: true, cmd: { kind: 'PROGRESS', taskId: t.split(/\s+/)[1] } };

  if (/^done\s+/i.test(t)) {
    const [, taskId, ...rest] = t.split(/\s+/);
    return { ok: true, cmd: { kind: 'DONE', taskId, evidenceLink: rest.join(' ') } };
  }

  // assign <memberKey> <task title> by <date>
  const assignMatch = t.match(/^assign\s+(.+?)\s+(.+?)(?:\s+by\s+(.+))?$/i);
  if (assignMatch) {
    const memberKey = assignMatch[1].trim();   // e.g. S10002 or "Student 2"
    const title = assignMatch[2].trim();       // task title
    const dueText = (assignMatch[3] || "").trim();
    return { ok: true, cmd: { kind: 'ASSIGN', memberKey, title, dueText: dueText || undefined } };
  }

  return { ok: false, error: 'Unknown command. Type `help`.' };
}

export type { ParsedCommand };