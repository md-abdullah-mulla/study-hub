import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

/**
 * One place that owns the study data (progress tree + dashboard).
 * Any page can read it and ask for `refresh()` after a change, so the
 * dashboard, sidebar and subject pages never show stale percentages.
 */
const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [tree, setTree] = useState({ subjects: [], semester: null });
  const [dashboard, setDashboard] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const [dashboardData, treeData, metaData] = await Promise.all([
        api.dashboard(),
        api.progressTree(),
        api.meta(),
      ]);
      setDashboard(dashboardData);
      setTree(treeData);
      setMeta(metaData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(
    () => ({
      tree,
      subjects: tree.subjects ?? [],
      semester: tree.semester,
      dashboard,
      meta,
      loading,
      error,
      refresh: () => load({ quiet: true }),
      reload: load,
      findSubject: (id) => (tree.subjects ?? []).find((s) => s.id === Number(id)),
      findChapter: (subjectId, chapterId) =>
        (tree.subjects ?? [])
          .find((s) => s.id === Number(subjectId))
          ?.chapters.find((c) => c.id === Number(chapterId)),
    }),
    [tree, dashboard, meta, loading, error, load]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>');
  return ctx;
}
