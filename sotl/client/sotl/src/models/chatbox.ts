export type UiTask = {
  id: string;
  title: string;
  status: string;
  dueAt?: string;
  description?: string;
};

export type Message =
  | { sender: 'user' | 'system'; text: string; kind?: 'text' }
  | { sender: 'system'; kind: 'tasks'; projectTitle: string; tasks: UiTask[] }
  | { sender: 'system'; kind: 'undo_tasks'; projectTitle: string; tasks: UiTask[] }
  | { sender: 'system'; kind: 'task_details'; task: UiTask }
  | { sender: 'system'; kind: 'confirm_done'; task: UiTask }
  | { sender: 'system'; kind: 'upload_evidence'; task: UiTask };

export type Role = 'Leader' | 'Member';

export type Deadline = {
  id: string;
  title: string;
  dueAt: string;
  daysLeft: number;
  submitted?: boolean;
};

export type ProjectItem = {
  id: string;
  title: string;
};

export type ParsedCommand =
  | { kind: 'HELP' }
  | { kind: 'PROJECTS' }
  | { kind: 'SELECT_PROJECT'; index: number }
  | { kind: 'PROJECT_ID_SET'; projectId: string }
  | { kind: 'TEAM' }
  | { kind: 'MEMBERS' }
  | { kind: 'UNDO_LIST' }
  | { kind: 'UNDO'; taskId: string }
  | { kind: 'MY' }
  | { kind: 'PROGRESS'; taskId: string }
  | { kind: 'ASSIGN'; memberKey: string; title: string; dueText?: string }
  | { kind: 'DONE'; taskId: string; evidenceLink: string };