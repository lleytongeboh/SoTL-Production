import { useEffect, useState } from 'react';

type Deadline = {
  id: string;
  title: string;
  dueAt: string;
  daysLeft: number;
  submitted?: boolean;
};

export function useDeadlines(isOpen: boolean, token: string | null) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token) return;

    const ac = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null); // ✅ clear previous error

        const res = await fetch('/api/deadlines/next?days=14', {
          headers: { Authorization: `Bearer ${token}` },
          signal: ac.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `Failed (${res.status})`);
        }

        const data = await res.json();
        const list: Deadline[] = Array.isArray(data) ? data : (data.results || []);
        setDeadlines(list);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setDeadlines([]);
        setError(e?.message ?? 'Failed to load deadlines');
      } finally {
        setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 60_000);

    return () => {
      ac.abort();
      clearInterval(timer);
    };
  }, [isOpen, token]);

  return { deadlines, loading, error };
}
