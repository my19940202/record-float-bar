import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ListTree } from 'lucide-react';
import type { OutlineContent, FloatingViewState } from '@/types/outline';
import {
  getFloatingState,
  nextFloatingChapter,
  prevFloatingChapter,
  setFloatingChapterIndex,
  setFloatingViewState,
} from '@/services/api';

interface FloatingPanelProps {
  outline: OutlineContent;
}

export function FloatingPanel({ outline }: FloatingPanelProps) {
  const [viewState, setViewStateLocal] = useState<FloatingViewState>('collapsed');
  const [chapterIndex, setChapterIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const state = await getFloatingState();
      if (!mounted) return;
      setViewStateLocal(state.viewState);
      setChapterIndex(state.chapterIndex);
    };
    void sync();
    const timer = window.setInterval(() => {
      void sync();
    }, 400);
    const unlistenPromise = listen<{
      chapterIndex: number;
      viewState: FloatingViewState;
    }>('floating-chapter-changed', (event) => {
      setChapterIndex(event.payload.chapterIndex);
      setViewStateLocal(event.payload.viewState);
    });
    return () => {
      mounted = false;
      window.clearInterval(timer);
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const safeIndex = Math.min(
    Math.max(chapterIndex, 0),
    Math.max(outline.chapters.length - 1, 0)
  );
  const activeChapter = outline.chapters[safeIndex];

  async function updateViewState(next: FloatingViewState) {
    setViewStateLocal(next);
    await setFloatingViewState(next);
  }

  return (
    <div className="flex min-h-screen items-start justify-end p-4">
      <motion.div
        layout
        className="glass-panel w-[280px] overflow-hidden rounded-2xl text-sm text-slate-900"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left font-medium"
          onClick={() =>
            void updateViewState(
              viewState === 'collapsed' ? 'chapters' : 'collapsed'
            )
          }
        >
          <span className="flex items-center gap-2">
            <ListTree className="size-4" />
            {outline.title}
          </span>
          {viewState === 'collapsed' ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronUp className="size-4" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {viewState !== 'collapsed' ? (
            <motion.div
              key="chapters"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/50"
            >
              <div className="space-y-1 px-2 py-2">
                {outline.chapters.map((chapter, index) => {
                  const active = index === chapterIndex;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      className={`w-full rounded-xl px-3 py-2 text-left transition ${
                        active
                          ? 'bg-white/80 font-medium shadow-sm'
                          : 'hover:bg-white/50'
                      }`}
                      onClick={() => {
                        setChapterIndex(index);
                        void setFloatingChapterIndex(index);
                        void updateViewState('detail');
                      }}
                    >
                      {index + 1}. {chapter.title}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {viewState === 'detail' && activeChapter ? (
            <motion.div
              key={activeChapter.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/50 px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{activeChapter.title}</p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 hover:bg-white/60"
                    onClick={() => void prevFloatingChapter()}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 hover:bg-white/60"
                    onClick={() => void nextFloatingChapter()}
                  >
                    ↓
                  </button>
                </div>
              </div>
              <ul className="space-y-2 text-[13px] leading-5 text-slate-700">
                {activeChapter.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
