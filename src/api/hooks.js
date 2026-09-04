import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useApi – Generic data-fetching hook.
 *
 * @param {Function} apiFn   – A function that returns a Promise (axios call).
 * @param {Array}    deps    – Re-fetch when these change (default: []).
 * @param {*}        initial – Initial value for `data`.
 *
 * Returns { data, loading, error, refetch }
 */
export function useApi(apiFn, deps = [], initial = null) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      if (mountedRef.current) {
        // Handle both { data: { data: [...] } } and { data: [...] }
        const payload = res.data?.data ?? res.data;
        setData(payload);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || err.message || "Request failed");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * useMutation – For create/update/delete operations.
 *
 * @param {Function} apiFn – The mutation function.
 * Returns { mutate, loading, error, reset }
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFn(...args);
        setLoading(false);
        return { success: true, data: res.data?.data ?? res.data };
      } catch (err) {
        let msg = err?.response?.data?.message || err.message || "Request failed";
        const errors = err?.response?.data?.errors;
        if (errors && Array.isArray(errors) && errors.length > 0) {
          msg = errors.map((e) => e.msg).join(", ");
        }
        setError(msg);
        setLoading(false);
        return { success: false, error: msg, errors };
      }
    },
    [apiFn]
  );

  const reset = useCallback(() => setError(null), []);

  return { mutate, loading, error, reset };
}

/**
 * downloadBlob – Trigger a file download from a blob response.
 */
export function downloadBlob(blobRes, fileName) {
  const url = window.URL.createObjectURL(new Blob([blobRes.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
