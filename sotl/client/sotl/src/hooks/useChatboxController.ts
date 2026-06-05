import { useEffect, useState, useRef } from 'react';
import { sendToLLM, LLMMessage } from '../services/llm';

import { useAuthToken } from './useAuthToken';
import { useDeadlines } from './useDeadlines';

import type { Deadline, Message, ProjectItem, Role, UiTask } from '../models/chatbox';
import { parseChatCommand } from '../utils/chatParser';
import { isValidHttpUrl } from '../utils/url';
import { parseDueToISO, formatDueLocal, formatDuePretty, formatDueOrDash, formatDueChatbox, isOverdue, daysOverdue } from '../utils/date';

import {
  fetchProjects,
  fetchMyTasks,
  fetchTeamTasks,
  fetchMembers,
  createChatTask,
  markTaskInProgress,
  markTaskDone,
  undoTask,
} from '../services/chatTasks.service';

import { uploadEvidenceFile } from '../services/uploads.service';

export function useChatboxController() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<UiTask | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [pendingAssignment, setPendingAssignment] = useState<{
    step: 'confirm_description' | 'awaiting_description';
    target: any;
    taskTitle: string;
    dueISO: string | null;
  } | null>(null);

  const token = useAuthToken();
  const alertedThisOpenRef = useRef(false);
  const messagesRef = useRef<Message[]>(messages);
  const previousTokenRef = useRef<string | null | undefined>(undefined);


  // TEMP role (keep as you had)
  const [role, setRole] = useState<Role>('Member');

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activeProjectTitle, setActiveProjectTitle] = useState<string>('');

  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    if (previousTokenRef.current === undefined) {
      previousTokenRef.current = token;
      return;
    }

    if (previousTokenRef.current === token) return;

    previousTokenRef.current = token;
    alertedThisOpenRef.current = false;
    messagesRef.current = [];
    setMessages([]);
    setInput('');
    setSelectedTask(null);
    setPendingFile(null);
    setPendingAssignment(null);
    setProjects([]);
    setActiveProjectId('');
    setActiveProjectTitle('');
  }, [token]);

  // deadlines moved to hook
  const { deadlines, loading: deadlinesLoading, error: deadlinesError } = useDeadlines(isOpen, token);
  const nextDeadline = (deadlines as Deadline[])[0]; // backend already sorts by daysLeft usually

  const deadlinesRef = useRef(deadlines);
  const deadlinesLoadingRef = useRef(deadlinesLoading);
  const deadlinesErrorRef = useRef<string | null>(deadlinesError);

  useEffect(() => {
    deadlinesRef.current = deadlines;
  }, [deadlines]);

  useEffect(() => {
    deadlinesLoadingRef.current = deadlinesLoading;
  }, [deadlinesLoading]);

  useEffect(() => {
    deadlinesErrorRef.current = deadlinesError;
  }, [deadlinesError]);

  const pushSystem = (t: string) => setMessages((p) => [...p, { sender: 'system', text: t }]);
  const pushUser = (t: string) => setMessages((p) => [...p, { sender: 'user', text: t }]);

  const replaceProjectsSummary = (summary: string) => {
    setMessages((prev) => {
      const summaryIndex = prev.findIndex((m: any) =>
        m.sender === 'system' &&
        typeof m.text === 'string' &&
        m.text.includes('Your Projects')
      );

      if (summaryIndex === -1) {
        return [...prev, { sender: 'system', text: summary }];
      }

      return prev.map((m, index) => (
        index === summaryIndex ? { sender: 'system', text: summary } : m
      ));
    });
  };

  const getUserIdFromJwt = (jwt?: string | null): string | null => {
    if (!jwt) return null;
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payloadB64Url = parts[1];
    try {
      const payloadB64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
      const json = atob(padded);
      const payload = JSON.parse(json);
      const id = payload?.userId ?? payload?.id ?? payload?._id ?? payload?.sub;
      return typeof id === 'string' && id.trim() ? id.trim() : null;
    } catch {
      return null;
    }
  };

  const extractObjectId = (v: unknown): string | null => {
    if (!v) return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v !== 'object') return null;
    const anyV = v as any;
    const oid = anyV?.$oid ?? anyV?.oid ?? anyV?.id ?? anyV?._id;
    if (typeof oid === 'string') return oid;
    if (typeof oid === 'object' && oid) {
      const nested = (oid as any)?.$oid;
      if (typeof nested === 'string') return nested;
    }
    return null;
  };

  const buildProjectsSummary = async () => {
    if (!token) return null;

    const projectsRes = await fetchProjects(token);
    const allProjects = projectsRes.results || [];
    if (!allProjects.length) return 'Type `projects` to begin.';

    const alerts: string[] = [];

    for (const proj of allProjects) {
      try {
        const projectId = proj.id;
        const projectTitle = proj.title;
        const userId = getUserIdFromJwt(token);
        let resolvedRole: Role =
          proj.groupRole === 'Leader' || proj.groupRole === 'Member'
            ? proj.groupRole
            : 'Member';

        if (userId && !proj.groupRole) {
          try {
            const membersRes = await fetchMembers(projectId, token);
            const members = pickMembersArrayFromResponse(membersRes);
            const normalizedMe = String(userId).toLowerCase();
            const mine = members.find((m: any) => {
              const sid =
                extractObjectId(m?.student_id) ??
                extractObjectId(m?.studentId) ??
                extractObjectId(m?.id);
              return sid ? String(sid).toLowerCase() === normalizedMe : false;
            });
            resolvedRole =
              mine?.group_role === 'Leader' || mine?.group_role === 'Member'
                ? (mine.group_role as Role)
                : 'Member';
          } catch {
            resolvedRole = 'Member';
          }
        }

        const tasksRes =
          resolvedRole === 'Leader'
            ? await fetchTeamTasks(projectId, token)
            : await fetchMyTasks(projectId, token);

        let items = tasksRes.results || [];
        items = items
          .filter((t: any) => t.status !== 'done' && t.status !== 'cancelled')
          .sort((a: any, b: any) => {
            const dateA = a.dueAt || a.dueDate;
            const dateB = b.dueAt || b.dueDate;
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });

        const taskLines = items.length > 0
          ? items.map((tt: any) => {
              const due = formatDueOrDash(tt.dueAt || tt.dueDate);
              const icon = isOverdue(tt.dueAt || tt.dueDate, tt.status) ? '⚠️' : '📝';
              const assigneeInfo = resolvedRole === 'Leader' && tt.assignedTo
                ? ` - ${tt.assignedTo.name || 'Unknown'}${tt.assignedTo.matricNumber ? ` (${tt.assignedTo.matricNumber})` : ''}`
                : '';
              return `  ${icon} ${tt.title}${assigneeInfo} • ${due}`;
            }).join('\n')
          : '  No active tasks';

        const taskLabel = resolvedRole === 'Leader' ? '**📋 Team Tasks:**' : '**📋 Tasks:**';
        alerts.push(`**(${alerts.length + 1}) ${projectTitle}**\n\n${taskLabel}\n${taskLines}`);
      } catch {
        // Keep the remaining project summaries usable.
      }
    }

    if (!alerts.length) return 'Type `projects` to begin.';
    return '**📚 Your Projects**\n\n' + alerts.join('\n\n---\n\n') + '\n\n💡 Type `projects` to begin.';
  };

  const refreshProjectsSummary = async () => {
    try {
      const summary = await buildProjectsSummary();
      if (summary) replaceProjectsSummary(summary);
    } catch {
      // Summary refresh should never block the task workflow.
    }
  };

  const pickMembersArrayFromResponse = (res: any): any[] => {
    const a = res?.results;
    if (Array.isArray(a)) return a;

    const b = res?.team_members;
    if (Array.isArray(b)) return b;

    const c = res?.group?.team_members;
    if (Array.isArray(c)) return c;

    return [];
  };

  const resolveRoleForProject = async (projectId: string, jwt: string): Promise<Role> => {
    const userId = getUserIdFromJwt(jwt);
    if (!userId) {
      setRole('Member');
      return 'Member';
    }

    try {
      const res = await fetchMembers(projectId, jwt);
      const members = pickMembersArrayFromResponse(res);

      const normalizedMe = String(userId).toLowerCase();
      const mine = members.find((m: any) => {
        const sid = extractObjectId(m?.student_id) ?? extractObjectId(m?.studentId) ?? extractObjectId(m?.id);
        return sid ? String(sid).toLowerCase() === normalizedMe : false;
      });

      const detected = (mine?.group_role === 'Leader' || mine?.group_role === 'Member')
        ? (mine.group_role as Role)
        : 'Member';

      setRole(detected);
      return detected;
    } catch {
      setRole('Member');
      return 'Member';
    }
  };

  useEffect(() => {
    if (!token || !activeProjectId) return;
    resolveRoleForProject(activeProjectId, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeProjectId]);

  /* ---------- Helper: Find similar command for typo detection ---------- */
  const findSimilarCommand = (input: string): string | null => {
    const KNOWN_COMMANDS = ['projects', 'my', 'team', 'assign', 'undo', 'members', 'next', 'deadlines', 'reset', 'commands'];
    const firstWord = input.trim().toLowerCase().split(' ')[0];
    
    // Check if first 3 characters match
    for (const cmd of KNOWN_COMMANDS) {
      if (firstWord.length >= 3 && cmd.startsWith(firstWord.slice(0, 3))) {
        return cmd;
      }
    }
    
    // Check for 1-2 character typos (similar length)
    for (const cmd of KNOWN_COMMANDS) {
      if (Math.abs(cmd.length - firstWord.length) <= 1) {
        let diff = 0;
        const minLen = Math.min(cmd.length, firstWord.length);
        for (let i = 0; i < minLen; i++) {
          if (cmd[i] !== firstWord[i]) diff++;
        }
        if (diff <= 2) return cmd;
      }
    }
    
    return null;
  };

  /* ---------- Context-aware suggestions ---------- */
  const updateSuggestions = () => {
    const suggs: string[] = [];

    // No project selected
    if (!activeProjectId) {
      suggs.push('📁 Type `projects` to view your projects');
      suggs.push('? Type `commands` for all commands');
      setSuggestions(suggs);
      return;
    }

    // Project selected - show role-based suggestions
    if (role === 'Leader') {
      suggs.push('👥 Type `members` to view team members');
      suggs.push('📊 Type `team` to view all team tasks');
      suggs.push('➕ Type `assign <matric> <task> by <date>` to create task');
    } else {
      suggs.push('📝 Type `my` to view your assigned tasks');
      suggs.push('� Type `team` to view team progress');
      suggs.push('👥 Type `members` to view team members');
    }

    // Common suggestions for both roles
    suggs.push('⏳ Type `next` to see next deliverable');
    suggs.push('? Type `commands` for all commands');

    setSuggestions(suggs);
  };

  /* ---------- Update suggestions when context changes ---------- */
  useEffect(() => {
    updateSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId, role]);

  /* ---------- Notification Badge Counter ---------- */
  useEffect(() => {
    if (isOpen) {
      setNotificationCount(0); // Clear badge when chatbox is opened
      return;
    }

    const checkNotifications = async () => {
      if (!token) return;

      try {
        let count = 0;
        const projectsRes = await fetchProjects(token);
        const allProjects = projectsRes.results || [];

        for (const proj of allProjects) {
          try {
            const tasksRes = await fetchMyTasks(proj.id, token);
            const tasks = tasksRes.results || [];

            // Count overdue tasks
            const overdueCount = tasks.filter((t: any) => isOverdue(t.dueAt, t.status)).length;
            count += overdueCount;

            // Count tasks due in 24 hours
            const dueSoonCount = tasks.filter((t: any) => {
              if (!t.dueAt || t.status === 'done') return false;
              const hoursLeft = (new Date(t.dueAt).getTime() - Date.now()) / (1000 * 60 * 60);
              return hoursLeft > 0 && hoursLeft <= 24;
            }).length;
            count += dueSoonCount;
          } catch {
            // Skip projects that error
          }
        }

        setNotificationCount(count);
      } catch {
        // Ignore errors in notification check
      }
    };

    // Wait 20 seconds after closing before first check
    const initialTimeout = setTimeout(checkNotifications, 20 * 1000);

    // Then check every 5 minutes
    const interval = setInterval(checkNotifications, 20 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isOpen, token]);

  /* ---------- Alerts on open (exactly once per open) ---------- */
  useEffect(() => {
    const run = async () => {
      if (!isOpen) return;
      if (!token) return;

      // prevent spam on rerenders
      if (alertedThisOpenRef.current) return;
      alertedThisOpenRef.current = true;

      if (messagesRef.current.length > 0) {
        updateSuggestions();
        return;
      }

      try {
        // Fetch all projects
        const projectsRes = await fetchProjects(token);
        const allProjects = projectsRes.results || [];

        if (!allProjects.length) {
          pushSystem('Type `projects` to begin.');
          updateSuggestions();
          return;
        }

        const alerts: string[] = [];

        // For each project, build summary
        for (const proj of allProjects) {
          try {
            const projectId = proj.id;
            const projectTitle = proj.title;

            // Resolve role for this project
            const userId = getUserIdFromJwt(token);
            let resolvedRole: Role =
              proj.groupRole === 'Leader' || proj.groupRole === 'Member'
                ? proj.groupRole
                : 'Member';

            if (userId && !proj.groupRole) {
              try {
                const membersRes = await fetchMembers(projectId, token);
                const members = pickMembersArrayFromResponse(membersRes);
                const normalizedMe = String(userId).toLowerCase();
                const mine = members.find((m: any) => {
                  const sid =
                    extractObjectId(m?.student_id) ??
                    extractObjectId(m?.studentId) ??
                    extractObjectId(m?.id);
                  return sid ? String(sid).toLowerCase() === normalizedMe : false;
                });
                resolvedRole =
                  mine?.group_role === 'Leader' || mine?.group_role === 'Member'
                    ? (mine.group_role as Role)
                    : 'Member';
              } catch {
                // fallback to Member
              }
            }

            // Get next deliverable
            const allDeadlines = (deadlinesRef.current as Deadline[]) || [];
            const nextDeadline = allDeadlines[0];
            const deadlineInfo = nextDeadline 
              ? `📅 Next deliverable: ${nextDeadline.title} • ${formatDueOrDash(nextDeadline.dueAt)}`
              : '';

            // Fetch tasks
            const tasksRes =
              resolvedRole === 'Leader'
                ? await fetchTeamTasks(projectId, token)
                : await fetchMyTasks(projectId, token);

            let items = tasksRes.results || [];
            items = items
              .filter((t: any) => t.status !== 'done' && t.status !== 'cancelled')
              .sort((a: any, b: any) => {
                const dateA = a.dueAt || a.dueDate;
                const dateB = b.dueAt || b.dueDate;
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateA).getTime() - new Date(dateB).getTime();
              });

            const formatStatus = (status: string) => {
              const lower = String(status || '').toLowerCase();
              if (lower === 'in progress' || lower === 'in_progress') return '⚙️';
              if (lower === 'assigned' || lower === 'todo') return '📝';
              return '•';
            };

            const taskLines = items.length > 0
              ? items
                  .map((tt: any) => {
                    const status = formatStatus(tt.status);
                    const due = formatDueOrDash(tt.dueAt || tt.dueDate);
                    const taskOverdue = isOverdue(tt.dueAt || tt.dueDate, tt.status);
                    const statusIcon = taskOverdue ? '⚠️' : status;
                    
                    // For leaders, include assignee info
                    if (resolvedRole === 'Leader' && tt.assignedTo) {
                      const assignee = tt.assignedTo.name || 'Unknown';
                      const matric = tt.assignedTo.matricNumber || '';
                      const assigneeInfo = matric ? `${assignee} (${matric})` : assignee;
                      return `  ${statusIcon} ${tt.title} - ${assigneeInfo} • ${due}`;
                    }
                    
                    // For members, show task with overdue warning
                    const overdueWarning = taskOverdue ? ' OVERDUE' : '';
                    return `  ${statusIcon} ${tt.title} • ${due}${overdueWarning}`;
                  })
                  .join('\n')
              : '  No active tasks';

            // Build project summary with role-specific label
            const taskLabel = resolvedRole === 'Leader' ? '**📋 Team Tasks:**' : '**📋 Tasks:**';
            
            let summary = `**(${alerts.length + 1}) ${projectTitle}**`;
            if (deadlineInfo) summary += `\n  ${deadlineInfo}`;
            summary += `\n\n${taskLabel}\n${taskLines}`;

            alerts.push(summary);
          } catch {
            // skip projects that error
          }
        }

        if (!alerts.length) {
          pushSystem('Type `projects` to begin.');
          updateSuggestions();
          return;
        }

        // Send all project summaries
        pushSystem('**📚 Your Projects**\n\n' + alerts.join('\n\n---\n\n') + '\n\n💡 Type `projects` to begin.');
        updateSuggestions();
      } catch (err: any) {
        pushSystem('Type `projects` to begin.');
        updateSuggestions();
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token]);

  const pushOrReplaceLastSystemError = (msg: string) => {
    setMessages((p) => {
      const last = p[p.length - 1];
      if (last?.sender === 'system' && (last as any).kind === 'error') {
        return [...p.slice(0, -1), { sender: 'system', kind: 'error', text: msg } as any];
      }
      return [...p, { sender: 'system', kind: 'error', text: msg } as any];
    });
  };

  /* ---------- Welcome ---------- */
  // (removed - alerts now provide instructions)

  /* ---------- Send ---------- */
  const handleSend = async () => {
    if (!input.trim() || !token) return;

    pushUser(input);
    const parsed = parseChatCommand(input);
    const text = input; // keep original before setInput
    setInput('');

    const t = text.trim().toLowerCase();

    // Handle pending assignment workflow
    if (pendingAssignment) {
      if (pendingAssignment.step === 'confirm_description') {
        if (t === 'yes' || t === 'y') {
          setPendingAssignment({
            ...pendingAssignment,
            step: 'awaiting_description',
          });
          pushSystem('📝 Please type the description for this task:');
          return;
        } else if (t === 'no' || t === 'n') {
          // Create task without description
          const body: any = {
            title: pendingAssignment.taskTitle,
            assignedTo: pendingAssignment.target.id,
          };
          if (pendingAssignment.dueISO) body.dueAt = pendingAssignment.dueISO;
          
          await createChatTask(activeProjectId, token, body);
          await refreshProjectsSummary();
          pushSystem(
            `→ Assigned **${pendingAssignment.taskTitle}** to **${pendingAssignment.target.name}**` +
              (pendingAssignment.target.matricNumber ? ` (${pendingAssignment.target.matricNumber})` : '') +
              (pendingAssignment.dueISO ? `\n📅 Due: ${formatDueChatbox(pendingAssignment.dueISO)}` : '')
          );
          setPendingAssignment(null);
          return;
        } else {
          pushSystem('Please type **yes** or **no**.');
          return;
        }
      } else if (pendingAssignment.step === 'awaiting_description') {
        // User typed the description
        const description = text.trim();
        const body: any = {
          title: pendingAssignment.taskTitle,
          assignedTo: pendingAssignment.target.id,
          description,
        };
        if (pendingAssignment.dueISO) body.dueAt = pendingAssignment.dueISO;
        
        await createChatTask(activeProjectId, token, body);
        await refreshProjectsSummary();
        pushSystem(
          `Assigned **${pendingAssignment.taskTitle}** to **${pendingAssignment.target.name}**` +
            (pendingAssignment.target.matricNumber ? ` (${pendingAssignment.target.matricNumber})` : '') +
            (pendingAssignment.dueISO ? `\n📅 Due: ${formatDueChatbox(pendingAssignment.dueISO)}` : '') +
            `\n📋 Description added.`
        );
        setPendingAssignment(null);
        return;
      }
    }

    // Handle task details response (help, progress, or done)
    if (selectedTask && (t === 'help' || t === 'done' || t === 'progress')) {
      if (t === 'help') {
        // Provide role-specific task help via LLM
        let helpPrompt = '';
        
        if (role === 'Leader') {
          // Leader gets management/delegation guidance
          helpPrompt = `You are advising a TEAM LEADER managing a Final Year Project task.

Task: ${selectedTask.title}
Description: ${selectedTask.description || '(no description)'}
Due: ${formatDueChatbox(selectedTask.dueAt)}

Provide leadership guidance in 150-200 words MAX:
1. Break task into 3-4 key subtasks (bullet points)
2. Suggest 1-2 quality checks the leader should ask for
3. Recommend when to check in (time-based)
4. Identify 1 common risk for this task type

Format:
- Use short bullets
- Be specific, not generic
- Focus on delegation & monitoring

Keep it concise for a chatbox interface.`;
        } else {
          // Member gets execution guidance
          helpPrompt = `You are advising a TEAM MEMBER working on a Final Year Project task.

Task: ${selectedTask.title}
Description: ${selectedTask.description || '(no description)'}
Due: ${formatDueChatbox(selectedTask.dueAt)}

Provide step-by-step execution guidance in 100-150 words MAX:
1. List 3-4 concrete steps to complete this task
2. Suggest 1 tool/resource to use
3. Estimate time per step
4. Warn about 1 common mistake

Format:
- Use numbered steps
- Be specific and actionable
- Keep it brief for chatbox

Keep it concise for a chatbox interface.`;
        }
        
        try {
          setIsTyping(true);
          const reply = await sendToLLM(
            [...messages, { sender: 'user', text }] as unknown as LLMMessage[],
            helpPrompt
          );
          setIsTyping(false);
          pushSystem(reply);
        } catch (err: any) {
          setIsTyping(false);
          pushSystem(`${err?.message || 'Failed to get help'}`);
        }
        return;
      } else if (t === 'progress') {
        // Mark task as in progress
        if (selectedTask.status === 'assigned') {
          try {
            await markTaskInProgress(activeProjectId, token, selectedTask.id);
            pushSystem(`🟡 **${selectedTask.title}** marked as in progress!`);
            setSelectedTask(null);
          } catch (err: any) {
            pushSystem(`${err?.message || 'Failed to update task status'}`);
          }
        } else {
          pushSystem(`⚠️ This task is already in progress or completed.`);
        }
        return;
      } else if (t === 'done') {
        // Proceed to mark done confirmation
        setMessages((p) => [
          ...p,
          { sender: 'system', kind: 'confirm_done', task: selectedTask }
        ]);
        return;
      }
    }

    // ===== ERROR HANDLING & VALIDATION LAYERS =====
    
    // Layer 1: Check for typos in commands
    const firstWord = text.trim().toLowerCase().split(' ')[0];
    const knownCommands = ['projects', 'my', 'team', 'assign', 'undo', 'members', 'next', 'deadlines', 'reset', 'commands', 'help'];
    const isLikelyCommand = !knownCommands.includes(firstWord) && firstWord.length <= 15 && !text.includes(' ');
    
    if (isLikelyCommand && !parsed.ok) {
      const suggestion = findSimilarCommand(text);
      if (suggestion) {
        pushSystem(`Did you mean **${suggestion}**?\n\nType \`commands\` to see all available commands.`);
        return;
      }
    }
    
    // Layer 2: Unknown command fallback (if single word and not recognized)
    if (!parsed.ok && firstWord.length > 2 && !text.includes(' ') && !text.includes('?')) {
      pushSystem(`I don't recognize that command.\n\n💡 Try:\n• Type \`commands\` to see all options\n• Ask me a question in plain English\n• Type \`help\` for guidance`);
      return;
    }

    // Layer 3: Context checks - Ensure project is selected for certain commands
    const projectRequiredCommands = ['MY', 'TEAM', 'ASSIGN', 'UNDO'];
    if (parsed.ok && projectRequiredCommands.includes(parsed.cmd.kind) && !activeProjectId) {
      pushSystem(`Please select a project first.\n\nType \`projects\` to see your projects.`);
      return;
    }
    
    // Layer 4: Permission checks - Validate role before execution
    const leaderOnlyCommands = ['ASSIGN', 'UNDO'];
    if (parsed.ok && leaderOnlyCommands.includes(parsed.cmd.kind) && role !== 'Leader') {
      pushSystem(`Only leaders can use the **${firstWord}** command.\n\n💡 Member commands:\n• \`my\` - View your tasks\n• \`team\` - View team progress\n• \`members\` - See team members\n• \`next\` - Next deadline\n• \`deadlines\` - Upcoming deadlines`);
      return;
    }
    
    // Layer 5: Parameter validation for ASSIGN command
    if (parsed.ok && parsed.cmd.kind === 'ASSIGN') {
      // Check if it's a valid assign command structure
      const assignPattern = /assign\s+(\S+)\s+(.+?)\s+by\s+(.+)/i;
      const match = text.match(assignPattern);
      
      if (!match) {
        pushSystem(`Invalid assign format.\n\n**Usage:** \`assign <matric> <task> by <date>\`\n**Example:** \`assign S10001 Write Report by Jan 15\`\n\n💡 Required:\n• Matric number (e.g., S10001)\n• Task title (at least 3 characters)\n• Due date (e.g., Jan 15, 15/1)`);
        return;
      }
      
      const [, matricPart, taskPart, datePart] = match;
      
      // Validate matric number format
      if (!/^S\d{5}$/i.test(matricPart)) {
        pushSystem(`Invalid matric number: **${matricPart}**\n\nMatric numbers must follow format **S10001** (S followed by 5 digits)\n\n**Example:** \`assign S10001 Write Report by Jan 15\``);
        return;
      }
      
      // Validate task title length
      if (taskPart.trim().length < 3) {
        pushSystem(`Task title too short: **${taskPart}**\n\nTask titles must be at least 3 characters.\n\n**Example:** \`assign S10001 Write Report by Jan 15\``);
        return;
      }
      
      // Validate date format (basic check)
      if (datePart.trim().length < 3) {
        pushSystem(`Invalid date format: **${datePart}**\n\n**Supported formats:**\n• Jan 15\n• 15 Jan\n• 15/1\n• 2026-01-15\n\n**Example:** \`assign S10001 Write Report by Jan 15\``);
        return;
      }
    }
    
    // ===== END ERROR HANDLING =====

    const isCommand =
      parsed.ok &&
      (parsed.cmd.kind === 'PROJECTS' ||
        parsed.cmd.kind === 'SELECT_PROJECT' ||
        parsed.cmd.kind === 'PROJECT_ID_SET' ||
        parsed.cmd.kind === 'HELP' ||
        parsed.cmd.kind === 'MY' ||
        parsed.cmd.kind === 'TEAM' ||
        parsed.cmd.kind === 'MEMBERS');

    const isProjectSensitive =
      t.includes('deliverable') ||
      t.includes('deadline') ||
      t.includes('due date') ||
      t.includes('due') ||
      t.includes('days left') ||
      t.includes('next');

    if (!isCommand && isProjectSensitive && !activeProjectId) {
      pushSystem('📁 Please select a project first. Type `projects`.');
      return;
    }

    // --- intent detectors ---
    const isNextDeliverableQ =
      t.includes('next deliverable') ||
      t.includes('my next deliverable') ||
      t.includes('what is my next deliverable') ||
      t === 'next' ||
      t === 'next deliverable';

    const isUpcomingDeliverablesQ =
      t.includes('upcoming deliverables') ||
      t.includes('list deliverables') ||
      t.includes('show deliverables') ||
      t.includes('upcoming deadline') ||
      t.includes('upcoming deadlines') ||
      t === 'deliverables' ||
      t === 'deadlines';

    const isDaysLeftQ =
      t.includes('days left') ||
      t.includes('how many days left') ||
      t.includes('how many days are left') ||
      t === 'days left' ||
      t === 'days';

    const isDeadlineQ =
      t.includes('deliverable deadline') ||
      t.includes('deadline') ||
      t.includes('due date') ||
      t.includes('when is the deliverable due');

    const top3 = (deadlines as Deadline[]).slice(0, 3);

    const isMyTasksQ =
      t === 'my' ||
      t.includes('my task') ||
      t.includes('my tasks') ||
      t.includes('what is my task') ||
      t.includes('show my task') ||
      t.includes('show my tasks');

    if (isMyTasksQ) {
      if (!activeProjectId) {
        pushSystem('Please select a project first. Type `projects` to see your projects.');
        return;
      }

      setIsTyping(true);
      const res = await fetchMyTasks(activeProjectId, token);
      setIsTyping(false);

      const items = res.results || [];

      //EARLY GUARD: no tasks → show message, do NOT render empty card
      if (!items.length) {
        pushSystem('📭 You have no tasks assigned at the moment.');
        return;
      }

      const tasks: UiTask[] = items.map((x: any) => ({
        id: x.id,
        title: x.title,
        status: x.status,
        dueAt: x.dueAt || x.dueDate,
        description: x.description,
      }));

      // Calculate completion metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const overdueTasks = tasks.filter(t => isOverdue(t.dueAt, t.status));
      const overdueCount = overdueTasks.length;

      // Build metrics message
      let metricsMsg = `**📊 Your Progress**\n\n`;
      metricsMsg += `✔ Completed: ${completedTasks}/${totalTasks} (${Math.round((completedTasks/totalTasks)*100)}%)\n`;
      metricsMsg += `⚙️ In Progress: ${inProgressTasks}\n`;
      metricsMsg += `📝 Not Started: ${totalTasks - completedTasks - inProgressTasks}\n`;
      
      if (overdueCount > 0) {
        metricsMsg += `\n⚠️ **${overdueCount} task${overdueCount > 1 ? 's' : ''} overdue!**\n`;
        overdueTasks.forEach(t => {
          const days = daysOverdue(t.dueAt, t.status);
          metricsMsg += `  ⏰ ${t.title} (${days}d overdue)\n`;
        });
      }

      pushSystem(metricsMsg);

      setMessages((p) => [
        ...p,
        {
          sender: 'system',
          kind: 'tasks',
          projectTitle: activeProjectTitle || 'Selected Project',
          tasks,
        },
      ]);
      return;
    }

    // --- smart replies ---
    if (isNextDeliverableQ || isDeadlineQ) {
      if (!nextDeadline) {
        pushSystem('📭 No upcoming deliverables found.');
        return;
      }

      pushSystem(
        `⏳ Next deliverable: **${nextDeadline.title}**\n` +
          `Due in **${nextDeadline.daysLeft} day(s)** (${formatDueLocal(nextDeadline.dueAt)}).`
      );
      return;
    }

    if (isUpcomingDeliverablesQ) {
      if (!top3.length) {
        pushSystem('📭 No upcoming deliverables found.');
        return;
      }

      pushSystem(
        `📌 **Upcoming deliverables**\n\n` +
          top3
            .map(
              (d, i) =>
                `(${i + 1}) **${d.title}** — ${d.daysLeft}d (${formatDueLocal(d.dueAt)})`
            )
            .join('\n')
      );
      return;
    }

    if (isDaysLeftQ) {
      if (!nextDeadline) {
        pushSystem('📭 No upcoming deliverables found.');
        return;
      }

      pushSystem(`⏳ **${nextDeadline.daysLeft} day(s)** left until **${nextDeadline.title}**.`);
      return;
    }

    try {
      // Not a command → send to LLM using YOUR message shape (sender/text)
      if (!parsed.ok) {
        // Fetch user's tasks to provide context for help requests
        let contextPrompt = 'You are a concise academic assistant helping a student with their Final Year Project tasks.';
        
        if (activeProjectId) {
          try {
            const tasksRes = await fetchMyTasks(activeProjectId, token);
            const userTasks = tasksRes.results || [];
            
            if (userTasks.length > 0) {
              contextPrompt += '\n\nThe student has the following tasks assigned:';
              userTasks.forEach((task: any) => {
                contextPrompt += `\n- **${task.title}**`;
                if (task.description) {
                  contextPrompt += `\n  Description: ${task.description}`;
                }
                contextPrompt += `\n  Status: ${task.status}`;
                if (task.dueAt) {
                  contextPrompt += `\n  Due: ${formatDueChatbox(task.dueAt)}`;
                }
              });
              contextPrompt += '\n\nWhen the student asks for help about a task, refer to the task details above and provide specific, actionable guidance.';
            }
          } catch (err) {
            // Silently continue if tasks fetch fails
          }
        }
        
        setIsTyping(true);
        try {
          const reply = await sendToLLM(
            [...messages, { sender: 'user', text }] as unknown as LLMMessage[],
            contextPrompt
          );
          setIsTyping(false);
          pushSystem(reply);
        } catch (err: any) {
          setIsTyping(false);
          pushSystem(`${err?.message || 'AI request failed'}`);
        }
        return;
      }

      if (parsed.cmd.kind === 'HELP') {
        // If no project selected yet, show both leader and member commands
        if (!activeProjectId) {
          const quickHelp = '**Quick Commands:** `projects` • `members` • `my` • `team` • `assign <matric> <task> by <date>` • `undo` • `next` • `deadlines` • `reset`';
          pushSystem(`${quickHelp}\n\n💡 **Click the ? icon** in the header for detailed help and examples`);
        } else {
          // Project selected, show role-specific commands
          const quickHelp = role === 'Leader'
            ? '**Quick Commands:** `projects` • `members` • `team` • `assign <matric> <task> by <date>` • `undo` • `next` • `deadlines` • `reset`'
            : '**Quick Commands:** `projects` • `members` • `my` • `team` • `next` • `deadlines` • `reset`';
          pushSystem(`${quickHelp}\n\n💡 **Click the ? icon** in the header for detailed help and examples`);
        }
        return;
      }

      /* PROJECT LIST */
      if (parsed.cmd.kind === 'PROJECTS') {
        const res = await fetchProjects(token);
        setProjects(res.results);

        // (optional) debug: see what fields backend returns
        // console.log('projects:', res.results);

        if (!res.results.length) {
          pushSystem('📭 You have no projects.');
          return;
        }

        pushSystem(
          '📁 **Your projects**\n\n' +
            res.results.map((p: any, i: number) => `(${i + 1}) **${p.title}**`).join('\n') +
            '\n\nType the project number to continue'
        );
        return;
      }

      /* SELECT PROJECT */
      if (parsed.cmd.kind === 'SELECT_PROJECT') {
        if (!projects.length) {
          pushSystem('📁 Please type `projects` first, then choose a number.');
          return;
        }

        const p = projects[parsed.cmd.index - 1];
        if (!p) {
          pushSystem('Invalid selection.');
          return;
        }

        setActiveProjectId(p.id);
        setActiveProjectTitle(p.title);

        const resolvedRole =
          p.groupRole === 'Leader' || p.groupRole === 'Member'
            ? p.groupRole
            : await resolveRoleForProject(p.id, token);
        setRole(resolvedRole);

        // Show different message based on role
        let selectionMsg = `Project selected: **${p.title}** ✔\n\n`;
        
        if (resolvedRole === 'Leader') {
          // For leaders, show deliverable and team status prompt
          const nextDel = nextDeadline 
            ? `📅 **${nextDeadline.title}** • ${formatDuePretty(nextDeadline.dueAt)}` 
            : 'No upcoming deliverables';
          
          selectionMsg += `**Deliverable:** ${nextDel}\n`;
          selectionMsg += `Type \`team\` to see team status`;
        } else {
          // For members, show deliverable and task info
          const nextDel = nextDeadline 
            ? `📅 **${nextDeadline.title}** • ${formatDuePretty(nextDeadline.dueAt)}` 
            : 'No upcoming deliverables';
          
          // Fetch member's tasks to show count
          try {
            const tasksRes = await fetchMyTasks(p.id, token);
            const myTasks = tasksRes.results || [];
            const pendingCount = myTasks.filter((t: any) => t.status !== 'done' && t.status !== 'cancelled').length;
            
            selectionMsg += `**Deliverable:** ${nextDel}\n`;
            selectionMsg += `**Tasks:** ${pendingCount} pending task${pendingCount !== 1 ? 's' : ''}\n`;
            selectionMsg += `Type \`my\` to see your task`;
          } catch {
            selectionMsg += `**Deliverable:** ${nextDel}\n`;
            selectionMsg += `**Tasks:** Type \`my\` to view your tasks`;
          }
        }
        
        pushSystem(selectionMsg);
        
        updateSuggestions();
        return;
      }

      /* MANUAL PROJECT ID */
      if (parsed.cmd.kind === 'PROJECT_ID_SET') {
        const id = parsed.cmd.projectId.trim();

        //allow reset
        if (!id) {
          setActiveProjectId('');
          setActiveProjectTitle('');
          pushSystem('🧹 Project selection cleared. Type `projects` to choose again.');
          return;
        }

        setActiveProjectId(id);
        setActiveProjectTitle('');
        pushSystem('Project ID set manually.');
        return;
      }

      /* REQUIRE PROJECT */
      if (!activeProjectId) {
        pushSystem('Please select a project first. Type `projects` to see your projects.');
        return;
      }

      if (parsed.cmd.kind === 'MEMBERS') {
        const res = await fetchMembers(activeProjectId, token);

        const members = pickMembersArrayFromResponse(res);
        if (!members.length) {
          pushSystem('📭 No members found for this project.');
          return;
        }

        // Your backend currently returns: student_id, group_role, _id, project_role
        pushSystem(
          `👥 **Group members (${res.groupName || res?.group?.name || 'Group'})**\n\n` +
            members
              .map((m: any, i: number) => {
                const memberRole = m.group_role ? ` — ${m.group_role}` : '';
                const display = m.name || m.username || m.email || extractObjectId(m.student_id) || m.student_id || m._id;
                const matric = m.matricNumber ? ` (${m.matricNumber})` : '';
                return `(${i + 1}) **${display}**${matric}${memberRole}`;
              })
              .join('\n')
        );
        return;
      }

      /* TASK COMMANDS */
      if (parsed.cmd.kind === 'MY') {
        const res = await fetchMyTasks(activeProjectId, token);

        if (!res.results.length) {
          pushSystem('📭 No tasks.');
          return;
        }
        const items = res.results || [];

        if (!items.length) {
          pushSystem('📭 No tasks.');
          return;
        }

        // Map to UiTask with description
        const tasks: UiTask[] = items.map((x: any) => ({
          id: x.id,
          title: x.title,
          status: x.status,
          dueAt: x.dueAt || x.dueDate,
          description: x.description,
        }));

        setMessages((p) => [
          ...p,
          {
            sender: 'system',
            kind: 'tasks',
            projectTitle: activeProjectTitle || 'Selected Project',
            tasks,
          },
        ]);
        return;
      }

      if (parsed.cmd.kind === 'TEAM') {
        setIsTyping(true);
        const res = await fetchTeamTasks(activeProjectId, token);
        setIsTyping(false);

        if (!res.results.length) {
          pushSystem('📭 No team tasks.');
          return;
        }

        // Calculate team completion metrics
        const allTasks = res.results;
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter((t: any) => t.status === 'done').length;
        const inProgressTasks = allTasks.filter((t: any) => t.status === 'in_progress').length;
        const overdueTasks = allTasks.filter((t: any) => isOverdue(t.dueAt, t.status));
        const overdueCount = overdueTasks.length;

        // Build team metrics message
        let metricsMsg = `**📊 Team Progress**\n\n`;
        metricsMsg += `✔ Completed: ${completedTasks}/${totalTasks} (${Math.round((completedTasks/totalTasks)*100)}%)\n`;
        metricsMsg += `⚙️ In Progress: ${inProgressTasks}\n`;
        metricsMsg += `📝 Not Started: ${totalTasks - completedTasks - inProgressTasks}\n`;
        
        if (overdueCount > 0) {
          metricsMsg += `\n⚠️ **${overdueCount} task${overdueCount > 1 ? 's' : ''} overdue!**\n`;
          overdueTasks.forEach((t: any) => {
            const days = daysOverdue(t.dueAt, t.status);
            const assignee = t.assignedTo?.name || 'Unassigned';
            metricsMsg += `  • ${t.title} - ${assignee} (${days}d overdue)\n`;
          });
        }

        pushSystem(metricsMsg);

        // Members can only see team progress, not individual tasks
        if (role === 'Member') {
          pushSystem('\n💡 Type `my` to see your assigned tasks');
          return;
        }

        // Leaders can see full task breakdown
        const icon = (s: string) => {
          const v = String(s || '').toLowerCase();
          if (v === 'done') return '✔';
          if (v === 'in_progress') return '🟡';
          if (v === 'assigned' || v === 'todo') return '📝';
          if (v === 'cancelled') return '⛔';
          return '•';
        };

        const fmt = (iso?: string) => {
          return formatDueOrDash(iso);
        };

        const formatDue = (iso?: string) => {
          return formatDueOrDash(iso);
        };

        pushSystem(
          `📊 **Team Tasks**\n` +
            res.results
              .map((tt: any, i: number) => {
                const who = tt.assignedTo?.name
                  ? `${tt.assignedTo.name} (${tt.assignedTo.matricNumber || '—'})`
                  : 'Unassigned';

                const status = String(tt.status).replace(/_/g, ' ');
                const due = formatDue(tt.dueAt);
                const overdueWarning = isOverdue(tt.dueAt, tt.status) ? ' ⚠️' : '';

                const evidence = tt.evidenceLink
                  ? `[PDF](${tt.evidenceLink})`
                  : '—';

                return (
                  `(${i + 1}) **${tt.title}**${overdueWarning}\n` +
                  `👤 ${who} | 📌 **${status}** | 🗓 ${due} | 📎 ${evidence}`
                );
              })
              .join('\n')
        );
        return;
      }

      if (parsed.cmd.kind === 'ASSIGN') {
        const memberKey = parsed.cmd.memberKey.trim();
        const taskTitle = parsed.cmd.title.trim();
        const dueISO = parseDueToISO(parsed.cmd.dueText);

        if (!memberKey || !taskTitle) {
          pushSystem('Usage: assign <matricNo> <task> by <date>');
          return;
        }

        // 1) Find members (from backend)
        const membersRes = await fetchMembers(activeProjectId, token);

        const members = pickMembersArrayFromResponse(membersRes);

        // match by matricNumber OR name OR email OR id
        const normalizedKey = memberKey.toLowerCase();
        let matches = members.filter((m: any) => {
          return (
            String(m.matricNumber || '').toLowerCase() === normalizedKey ||
            String(m.name || '').toLowerCase() === normalizedKey ||
            String(m.email || '').toLowerCase() === normalizedKey
          );
        });

        // 2️⃣ If no exact match, try partial name
        if (!matches.length) {
          matches = members.filter((m: any) =>
            String(m.name || '').toLowerCase().includes(normalizedKey)
          );
        }

        // 3️⃣ Handle results
        if (!matches.length) {
          pushSystem(`No member found matching **${memberKey}**.`);
          return;
        }

        if (matches.length > 1) {
          pushSystem(
            `⚠️ Multiple members match **${memberKey}**. Please be more specific:\n\n` +
              matches
                .map(
                  (m: any) =>
                    `- ${m.name}${m.matricNumber ? ` (${m.matricNumber})` : ''}`
                )
                .join('\n')
          );
          return;
        }

        const target = matches[0];

        if (!target) {
          pushSystem(
            `Member not found: **${memberKey}**.\n` +
              `Tip: use matric number like **S10002** (recommended).`
          );
          return;
        }

        // Ask if leader wants to add description
        setPendingAssignment({
          step: 'confirm_description',
          target,
          taskTitle,
          dueISO,
        });
        pushSystem(
          `📝 Would you like to add a description for **${taskTitle}**?\n\nType **yes** to add description, or **no** to skip.`
        );
        return;
      }

      if (parsed.cmd.kind === 'PROGRESS') {
        await markTaskInProgress(activeProjectId, token, parsed.cmd.taskId);
        await refreshProjectsSummary();
        pushSystem('🟡 Task marked in progress.');
        return;
      }

      if (parsed.cmd.kind === 'DONE') {
        if (!parsed.cmd.evidenceLink?.trim()) {
          pushSystem('Evidence link required. Usage: done <taskId> <link>');
          return;
        }
        if (!isValidHttpUrl(parsed.cmd.evidenceLink)) {
          pushSystem('evidenceLink must be a valid URL (http/https).');
          return;
        }

        await markTaskDone(activeProjectId, token, parsed.cmd.taskId, parsed.cmd.evidenceLink.trim());
        await refreshProjectsSummary();
        pushSystem('✔Task marked done.');
        return;
      }

      if (parsed.cmd.kind === 'UNDO_LIST') {
        // Show clickable list of tasks that can be undone (assigned/in_progress only)
        const res = await fetchTeamTasks(activeProjectId, token);
        const undoable = (res.results || []).filter((t: any) => 
          t.status === 'assigned' || t.status === 'in_progress'
        );

        if (!undoable.length) {
          pushSystem('📭 No tasks to cancel. All tasks are either done or already cancelled.');
          return;
        }

        const tasks: UiTask[] = undoable.map((x: any) => ({
          id: x.id,
          title: x.title,
          status: x.status,
          dueAt: x.dueAt || x.dueDate,
        }));

        setMessages((p) => [
          ...p,
          {
            sender: 'system',
            kind: 'undo_tasks',
            projectTitle: activeProjectTitle || 'Selected Project',
            tasks,
          },
        ]);
        return;
      }

      if (parsed.cmd.kind === 'UNDO') {
        await undoTask(activeProjectId, token, parsed.cmd.taskId);
        await refreshProjectsSummary();
        pushSystem('Task is cancelled.');
        return;
      }
    } catch (err: any) {
      const msg = err?.message || 'Request failed';
      if (msg.toLowerCase().includes('forbidden') || msg.includes('403')) {
        pushSystem('Only Leader can assign tasks for this project.');
      } else {
        pushSystem(`${msg}`);
      }
    }
  };

  // UI event handlers moved out of Chatbox.tsx (no behavior change)
  const onTaskClick = (t: UiTask) => {
    // prevent duplicate for same task
    if (selectedTask?.id === t.id) return;

    setSelectedTask(t);
    setMessages((p) => [
      ...p,
      { sender: 'system', kind: 'task_details', task: t }
    ]);
  };

  const onUndoTaskClick = async (t: UiTask) => {
    if (!token) return;
    try {
      await undoTask(activeProjectId, token, t.id);
      await refreshProjectsSummary();
      setMessages((p) => [...p, { sender: 'system', text: `Cancelled: **${t.title}**` }]);
    } catch (err: any) {
      pushSystem(`${err?.message || 'Failed to cancel task'}`);
    }
  };

  const onConfirmDoneYes = (t: UiTask) => {
    setMessages((p) => [...p, { sender: 'system', kind: 'upload_evidence', task: t }]);
  };

  const onConfirmDoneNo = () => {
    setSelectedTask(null);
    setMessages((p) => [...p, { sender: 'system', text: 'Okay, not marking it done.' }]);
  };

  const onPendingFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingFile(e.target.files?.[0] || null);
  };

  const onUploadAndSubmit = async (t: UiTask) => {
    if (!pendingFile) {
      pushOrReplaceLastSystemError('Please choose a file first.');
      return;
    }

    try {
      // 1) upload file -> get URL
      const url = await uploadEvidenceFile(pendingFile, token as string);

      // 2) mark done with evidenceLink url
      await markTaskDone(activeProjectId, token as string, t.id, url);
      await refreshProjectsSummary();

      setPendingFile(null);
      setSelectedTask(null);

      setMessages((p) => [
        ...p,
        { sender: 'system', text: `✔ Marked done: **${t.title}**\n📎 Evidence uploaded.` },
      ]);
    } catch (err: any) {
      pushOrReplaceLastSystemError(`${err?.message || 'Upload/submit failed'}`);
    }
  };

  const onUploadCancel = () => {
    setPendingFile(null);
    setSelectedTask(null);
    setMessages((p) => [...p, { sender: 'system', text: 'Cancelled evidence upload.' }]);
  };

  const onMarkProgress = async () => {
    if (!selectedTask || !token || !activeProjectId) return;
    
    if (selectedTask.status === 'assigned') {
      try {
        await markTaskInProgress(activeProjectId, token, selectedTask.id);
        await refreshProjectsSummary();
        pushUser('progress');
        pushSystem(`🟡 **${selectedTask.title}** marked as in progress!`);
        setSelectedTask(null);
      } catch (err: any) {
        pushUser('progress');
        pushSystem(`${err?.message || 'Failed to update task status'}`);
      }
    } else {
      pushUser('progress');
      pushSystem(`⚠️ This task is already in progress or completed.`);
    }
  };

  const onMarkDone = () => {
    if (!selectedTask) return;
    pushUser('done');
    setMessages((p) => [
      ...p,
      { sender: 'system', kind: 'confirm_done', task: selectedTask }
    ]);
  };

  const onGetHelp = async () => {
    if (!selectedTask || !token) return;
    
    pushUser('help');
    
    let helpPrompt = '';
    
    if (role === 'Leader') {
      helpPrompt = `You are advising a TEAM LEADER managing a Final Year Project task.

Task: ${selectedTask.title}
Description: ${selectedTask.description || '(no description)'}
Due: ${formatDueChatbox(selectedTask.dueAt)}

Provide leadership guidance in 150-200 words MAX:
1. Break task into 3-4 key subtasks (bullet points)
2. Suggest 1-2 quality checks the leader should ask for
3. Recommend when to check in (time-based)
4. Identify 1 common risk for this task type

Format:
- Use short bullets
- Be specific, not generic
- Focus on delegation & monitoring

Keep it concise for a chatbox interface.`;
    } else {
      helpPrompt = `You are advising a TEAM MEMBER working on a Final Year Project task.

Task: ${selectedTask.title}
Description: ${selectedTask.description || '(no description)'}
Due: ${formatDueChatbox(selectedTask.dueAt)}

Provide step-by-step execution guidance in 100-150 words MAX:
1. List 3-4 concrete steps to complete this task
2. Suggest 1 tool/resource to use
3. Estimate time per step
4. Warn about 1 common mistake

Format:
- Use numbered steps
- Be specific and actionable
- Keep it brief for chatbox

Keep it concise for a chatbox interface.`;
    }
    
    try {
      setIsTyping(true);
      const reply = await sendToLLM(
        [...messages, { sender: 'user', text: 'help' }] as unknown as LLMMessage[],
        helpPrompt
      );
      setIsTyping(false);
      pushSystem(reply);
    } catch (err: any) {
      setIsTyping(false);
      pushSystem(`${err?.message || 'Failed to get help'}`);
    }
  };

  return {
    // state
    token,
    messages,
    input,
    isOpen,
    nextDeadline,
    suggestions,
    role,
    activeProjectTitle,
    isTyping,
    notificationCount,

    // setters for presentational wiring
    setInput,
    setIsOpen,

    // handlers
    handleSend,
    onTaskClick,
    onUndoTaskClick,
    onConfirmDoneYes,
    onConfirmDoneNo,
    onPendingFileInputChange,
    onUploadAndSubmit,
    onUploadCancel,
    onMarkProgress,
    onMarkDone,
    onGetHelp,
  };
}
