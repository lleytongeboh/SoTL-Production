import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../features/auth/context';

const normalizeToken = (raw?: string | null): string | null => {
  const cleaned = String(raw || '').trim().replace(/^Bearer\s+/i, '');
  return /^[\w-]+\.[\w-]+\.[\w-]+$/.test(cleaned) ? cleaned : null;
};

export function useAuthToken() {
  const { token: authToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const readToken = useCallback(() => {
    const keys = ['token', 'accessToken', 'jwt'];

    for (const k of keys) {
      const storedToken = normalizeToken(sessionStorage.getItem(k) || localStorage.getItem(k));
      if (storedToken) {
        setToken(storedToken);
        return;
      }
    }
    setToken(null);
  }, []);

  useEffect(() => {
    const normalizedAuthToken = normalizeToken(authToken);
    if (normalizedAuthToken) {
      setToken(normalizedAuthToken);
      return;
    }

    readToken();
  }, [authToken, readToken]);

  useEffect(() => {
    readToken();

    window.addEventListener('storage', readToken);
    window.addEventListener('focus', readToken); // ✅ same-tab login/logout fix
    return () => {
      window.removeEventListener('storage', readToken);
      window.removeEventListener('focus', readToken);
    };
  }, [readToken]);

  return token;
}
