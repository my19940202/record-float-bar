import { useEffect, useState } from 'react';
import { FloatingPanel } from '@/components/FloatingPanel';
import { getOutline } from '@/services/api';
import type { OutlineContent } from '@/types/outline';

export function FloatingOutlineWindow() {
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
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));
    if (!id) {
      setError('未指定提纲');
      return;
    }
    void (async () => {
      try {
        const record = await getOutline(id);
        setOutline(record.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      }
    })();
  }, []);

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
          加载中...
        </div>
      </div>
    );
  }

  return <FloatingPanel outline={outline} />;
}
