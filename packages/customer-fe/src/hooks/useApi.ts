import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useApiGet<T>(path: string | null, deps: unknown[] = []) {
  const { token } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) return;
    setLoading(true);
    setError(null);
    api
      .get<T>(path, token || undefined)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [path, token, ...deps]);

  return { data, loading, error };
}

export function useApiMutation<TBody, TResponse = unknown>() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (method: 'post' | 'put' | 'delete', path: string, body?: TBody) => {
      setLoading(true);
      setError(null);
      try {
        const result = await (api[method] as any)(path, body, token || undefined) as TResponse;
        return result;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return { mutate, loading, error };
}
