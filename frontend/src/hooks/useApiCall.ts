import { useCallback, useRef, useState } from "react";

export function useApiCall<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: { initialLoading?: boolean },
) {
  const [loading, setLoading] = useState(options?.initialLoading ?? false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const execute = useCallback(async (...args: TArgs): Promise<TResult> => {
    setLoading(true);
    try {
      return await fnRef.current(...args);
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading };
}
