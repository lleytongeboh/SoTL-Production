export async function apiFetch<T>(url: string, token: string, options?: any): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export function fetchProjects(token: string) {
  return apiFetch<{ results: any[] }>('/api/chat-tasks/projects', token);
}

export function fetchMyTasks(projectId: string, token: string) {
  return apiFetch<any>(`/api/chat-tasks/my?projectId=${projectId}`, token);
}

export function fetchTeamTasks(projectId: string, token: string) {
  return apiFetch<any>(`/api/chat-tasks/team?projectId=${projectId}`, token);
}

export function fetchMembers(projectId: string, token: string) {
  return apiFetch<any>(`/api/chat-tasks/members?projectId=${projectId}`, token);
}

export function createChatTask(projectId: string, token: string, body: any) {
  return apiFetch<any>(
    `/api/chat-tasks?projectId=${projectId}`,
    token,
    { method: 'POST', body: JSON.stringify(body) }
  );
}

export function markTaskInProgress(projectId: string, token: string, taskId: string) {
  return apiFetch(
    `/api/chat-tasks/${taskId}?projectId=${projectId}`,
    token,
    { method: 'PATCH', body: JSON.stringify({ status: 'in_progress' }) }
  );
}

export function markTaskDone(projectId: string, token: string, taskId: string, evidenceLink: string) {
  return apiFetch(
    `/api/chat-tasks/${taskId}?projectId=${projectId}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'done',
        evidenceLink,
      }),
    }
  );
}

export function undoTask(projectId: string, token: string, taskId: string) {
  return apiFetch(
    `/api/chat-tasks/${taskId}/undo?projectId=${projectId}`,
    token,
    { method: 'POST' }
  );
}