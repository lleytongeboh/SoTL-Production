import { useEffect, useState, useCallback } from 'react';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  const readToken = useCallback(() => {
    const keys = ['token', 'accessToken', 'jwt'];

    for (const k of keys) {
      const raw = (sessionStorage.getItem(k) || localStorage.getItem(k) || '').trim();
      const cleaned = raw.replace(/^Bearer\s+/i, '');
      if (/^[\w-]+\.[\w-]+\.[\w-]+$/.test(cleaned)) {
        setToken(cleaned);
        return;
      }
    }
    setToken(null);
  }, []);

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
