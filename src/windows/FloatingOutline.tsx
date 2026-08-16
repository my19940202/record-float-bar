import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { FloatingPanel } from '@/components/FloatingPanel';
import { useI18n } from '@/lib/i18n';
import { getFloatingState, getOutline } from '@/services/api';
import type { OutlineContent } from '@/types/outline';

export function FloatingOutlineWindow() {
  const { t } = useI18n();
  const [outline, setOutline] = useState<OutlineContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('floating-root');
    document.body.classList.add('floating-root');
    return () => {
      document.documentElement.classList.remove('floating-root');
      document.body.classList.remove('floating-root');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOutline(id: number | null) {
      if (!id) {
        setOutline(null);
        setError(t.floatingWindow.missingOutline);
        return;
      }

      setError(null);
      setOutline(null);
      try {
        const record = await getOutline(id);
        if (cancelled) return;
        setOutline(record.content);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t.floatingWindow.loadError);
      }
    }

    async function loadInitialOutline() {
      const params = new URLSearchParams(window.location.search);
      const urlId = Number(params.get('id'));
      if (urlId) {
        await loadOutline(urlId);
        return;
      }

      const state = await getFloatingState();
      await loadOutline(state.outlineId);
    }

    void loadInitialOutline();

    const unlistenPromise = listen<{ id: number }>(
      'floating-outline-selected',
      (event) => {
        void loadOutline(event.payload.id);
      }
    );

    return () => {
      cancelled = true;
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [t.floatingWindow.loadError, t.floatingWindow.missingOutline]);

  if (error) {
    return (
      <div className="flex min-h-screen items-start justify-end p-4">
        <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="flex min-h-screen items-start justify-end p-4">
        <div className="glass-panel rounded-2xl px-4 py-3 text-sm">
          {t.floatingWindow.loading}
        </div>
      </div>
    );
  }

  return <FloatingPanel outline={outline} />;
}
