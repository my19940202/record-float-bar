import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { currentMonitor, getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  X,
  ListTree,
  Settings2,
  Palette,
} from 'lucide-react';
import type {
  FloatingBackground,
  FloatingSettings,
  FloatingViewState,
  OutlineContent,
} from '@/types/outline';
import {
  getFloatingSettings,
  getFloatingState,
  hideFloatingOutline,
  saveFloatingSettings,
  setFloatingChapterIndex,
  setFloatingViewState,
} from '@/services/api';
import { useI18n } from '@/lib/i18n';

interface FloatingPanelProps { outline: OutlineContent }

const defaultSettings: FloatingSettings = {
  theme: 'light',
  layout: 'vertical',
  background: 'cream',
  fontSize: 16,
  opacity: 0.85,
  blur: 24,
};

const backgroundChoices: Array<{
  value: FloatingBackground;
  labelKey: FloatingBackground;
  swatch: string;
}> = [
  { value: 'cream', labelKey: 'cream', swatch: '#fff4e6' },
  { value: 'white', labelKey: 'white', swatch: '#ffffff' },
  { value: 'lavender', labelKey: 'lavender', swatch: '#eadcff' },
  { value: 'blue', labelKey: 'blue', swatch: '#dff2ff' },
  { value: 'pink', labelKey: 'pink', swatch: '#ffe1eb' },
  { value: 'slate', labelKey: 'slate', swatch: '#111827' },
  { value: 'butter', labelKey: 'butter', swatch: '#fff8ca' },
  { value: 'lemon', labelKey: 'lemon', swatch: '#f9ff9e' },
  { value: 'lilac', labelKey: 'lilac', swatch: '#f3e8ff' },
  { value: 'sky', labelKey: 'sky', swatch: '#dcf4ff' },
  { value: 'blush', labelKey: 'blush', swatch: '#ffe7df' },
  { value: 'graphite', labelKey: 'graphite', swatch: '#241f33' },
];

interface HorizontalResizeState {
  direction: 'west' | 'east';
  pointerId: number;
  startScreenX: number;
  startX: number;
  startY: number;
  startWidth: number;
  height: number;
}

export function FloatingPanel({ outline }: FloatingPanelProps) {
  const { t } = useI18n();
  const [viewState, setViewStateLocal] = useState<FloatingViewState>('collapsed');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [detailMaxHeight, setDetailMaxHeight] = useState(280);
  const chapterIndexRef = useRef(0);
  const resizeState = useRef<HorizontalResizeState | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const chromeHideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const [state, storedSettings] = await Promise.all([getFloatingState(), getFloatingSettings()]);
      if (!mounted) return;
      setViewStateLocal(state.viewState);
      chapterIndexRef.current = state.chapterIndex;
      setChapterIndex(state.chapterIndex);
      setSettings(storedSettings);
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 400);
    const unlistenPromise = listen<{ direction: 'previous' | 'next' }>(
      'floating-navigation-requested', (event) => {
        void navigateChapter(event.payload.direction === 'previous' ? -1 : 1);
      }
    );
    return () => {
      mounted = false;
      window.clearInterval(timer);
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (settings.layout !== 'horizontal') return;
    void (async () => {
      const [monitor, size] = await Promise.all([
        currentMonitor(),
        getCurrentWindow().innerSize(),
      ]);
      if (!monitor) return;
      const width = Math.round((monitor.workArea.size.width / monitor.scaleFactor) * 0.8);
      const height = Math.round(size.height / monitor.scaleFactor);
      if (Math.abs(width - size.width / monitor.scaleFactor) > 8) {
        await getCurrentWindow().setSize(new LogicalSize(width, height));
      }
    })();
  }, [settings.layout]);

  useEffect(() => {
    void currentMonitor().then((monitor) => {
      if (!monitor) return;
      setDetailMaxHeight(
        Math.round((monitor.workArea.size.height / monitor.scaleFactor) * 0.3)
      );
    });
  }, []);

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    let disposed = false;
    let pendingHeight = Math.ceil(stack.getBoundingClientRect().height);

    const resizeWindowToContent = async () => {
      resizeFrameRef.current = null;
      const targetHeight = pendingHeight;
      const appWindow = getCurrentWindow();
      const [size, position, scaleFactor] = await Promise.all([
        appWindow.innerSize(),
        appWindow.outerPosition(),
        appWindow.scaleFactor(),
      ]);
      if (disposed) return;

      const logicalSize = size.toLogical(scaleFactor);
      if (Math.abs(logicalSize.height - targetHeight) < 2) return;
      const logicalPosition = position.toLogical(scaleFactor);
      const bottom = logicalPosition.y + logicalSize.height;
      await Promise.all([
        appWindow.setSize(new LogicalSize(logicalSize.width, targetHeight)),
        appWindow.setPosition(
          new LogicalPosition(logicalPosition.x, bottom - targetHeight)
        ),
      ]);
    };

    const scheduleResize = (height: number) => {
      pendingHeight = Math.max(48, Math.ceil(height));
      if (resizeFrameRef.current !== null) return;
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        void resizeWindowToContent();
      });
    };

    const observer = new ResizeObserver(([entry]) => {
      scheduleResize(entry.contentRect.height);
    });
    observer.observe(stack);
    scheduleResize(pendingHeight);

    return () => {
      disposed = true;
      observer.disconnect();
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        } else if (viewState === 'detail') {
          void updateViewState('chapters');
        }
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (settingsOpen) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      ) return;
      event.preventDefault();
      void navigateChapter(event.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, viewState]);

  useEffect(() => {
    return () => {
      if (chromeHideTimerRef.current !== null) {
        window.clearTimeout(chromeHideTimerRef.current);
      }
    };
  }, []);

  const safeIndex = Math.min(Math.max(chapterIndex, 0), Math.max(outline.chapters.length - 1, 0));
  const activeChapter = outline.chapters[safeIndex];
  const expanded = viewState !== 'collapsed';
  const panelStyle = {
    '--floating-opacity': settings.opacity,
    '--floating-blur': `${settings.blur}px`,
    '--floating-font-size': `${settings.fontSize}px`,
    '--floating-detail-max-height': `${detailMaxHeight}px`,
  } as React.CSSProperties;

  async function updateViewState(next: FloatingViewState) {
    setViewStateLocal(next);
    await setFloatingViewState(next);
  }

  async function updateSettings(patch: Partial<FloatingSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveFloatingSettings(next);
  }

  async function navigateChapter(direction: -1 | 1) {
    if (outline.chapters.length === 0) return;
    const nextIndex = Math.min(
      Math.max(chapterIndexRef.current + direction, 0),
      outline.chapters.length - 1
    );
    chapterIndexRef.current = nextIndex;
    setChapterIndex(nextIndex);
    setViewStateLocal('detail');
    await Promise.all([
      setFloatingChapterIndex(nextIndex),
      setFloatingViewState('detail'),
    ]);
  }

  function showCompactChrome() {
    if (chromeHideTimerRef.current !== null) {
      window.clearTimeout(chromeHideTimerRef.current);
      chromeHideTimerRef.current = null;
    }
    setChromeVisible(true);
  }

  function scheduleCompactChromeHide() {
    if (settingsOpen) return;
    if (chromeHideTimerRef.current !== null) {
      window.clearTimeout(chromeHideTimerRef.current);
    }
    chromeHideTimerRef.current = window.setTimeout(() => {
      setChromeVisible(false);
      chromeHideTimerRef.current = null;
    }, 400);
  }

  function startWindowDragging(event: React.MouseEvent<HTMLElement>) {
    if (event.button !== 0) return;
    void getCurrentWindow().startDragging().catch((error) => {
      console.error(t.floatingPanel.dragFailed, error);
    });
  }

  async function beginHorizontalResize(
    event: React.PointerEvent<HTMLDivElement>,
    direction: HorizontalResizeState['direction']
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const appWindow = getCurrentWindow();
    const [size, position, scaleFactor] = await Promise.all([
      appWindow.innerSize(),
      appWindow.outerPosition(),
      appWindow.scaleFactor(),
    ]);
    const logicalSize = size.toLogical(scaleFactor);
    const logicalPosition = position.toLogical(scaleFactor);
    resizeState.current = {
      direction,
      pointerId: event.pointerId,
      startScreenX: event.screenX,
      startX: logicalPosition.x,
      startY: logicalPosition.y,
      startWidth: logicalSize.width,
      height: logicalSize.height,
    };
  }

  function continueHorizontalResize(event: React.PointerEvent<HTMLDivElement>) {
    const state = resizeState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const delta = event.screenX - state.startScreenX;
    const requestedWidth = state.direction === 'east'
      ? state.startWidth + delta
      : state.startWidth - delta;
    const width = Math.max(280, requestedWidth);
    const appWindow = getCurrentWindow();

    if (state.direction === 'west') {
      const appliedDelta = state.startWidth - width;
      void Promise.all([
        appWindow.setPosition(new LogicalPosition(state.startX + appliedDelta, state.startY)),
        appWindow.setSize(new LogicalSize(width, state.height)),
      ]);
      return;
    }
    void appWindow.setSize(new LogicalSize(width, state.height));
  }

  function endHorizontalResize(event: React.PointerEvent<HTMLDivElement>) {
    if (resizeState.current?.pointerId !== event.pointerId) return;
    resizeState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div className={`floating-shell floating-light floating-bg-${settings.background}`} style={panelStyle}>
      <div
        className="floating-width-resize floating-width-resize-west"
        onPointerDown={(event) => void beginHorizontalResize(event, 'west')}
        onPointerMove={continueHorizontalResize}
        onPointerUp={endHorizontalResize}
        onPointerCancel={endHorizontalResize}
      />
      <div
        className="floating-width-resize floating-width-resize-east"
        onPointerDown={(event) => void beginHorizontalResize(event, 'east')}
        onPointerMove={continueHorizontalResize}
        onPointerUp={endHorizontalResize}
        onPointerCancel={endHorizontalResize}
      />
      <div
        ref={stackRef}
        className={`floating-stack ${settings.layout === 'horizontal' ? 'floating-horizontal' : 'floating-vertical'}`}
      >
        <AnimatePresence initial={false} mode="wait">
          {viewState === 'detail' && activeChapter && activeChapter.points.length > 0 && !settingsOpen ? (
            <motion.div
              key={activeChapter.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="floating-detail-popover"
            >
              <div className="floating-detail-header">
                <p>{activeChapter.title}</p>
                <button
                  type="button"
                  aria-label={t.floatingPanel.collapseDetail}
                  title={t.floatingPanel.collapseDetail}
                  className="floating-icon-button"
                  onClick={() => void updateViewState('chapters')}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <ul className="floating-detail-body floating-points">
                {activeChapter.points.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div
          layout
          className={`glass-panel floating-panel ${settings.layout === 'horizontal' ? 'floating-horizontal' : 'floating-vertical'} ${expanded ? 'floating-panel-expanded' : ''} ${expanded && settingsOpen ? 'floating-settings-open' : ''}`}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        >
        {expanded ? (
          <div
            className={`floating-compact-chrome ${chromeVisible || settingsOpen ? 'visible' : ''}`}
            onMouseEnter={showCompactChrome}
            onMouseLeave={scheduleCompactChromeHide}
            onMouseDown={startWindowDragging}
          >
            <div className="floating-compact-toolbar">
              <div className="floating-compact-drag" aria-label={t.floatingPanel.dragWindow}>
                <ListTree className="size-4" />
              </div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label={t.floatingPanel.settings} className="floating-icon-button" onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                  setSettingsOpen((value) => !value);
                  showCompactChrome();
                }}>
                  <Settings2 className="size-4" />
                </button>
                <button type="button" aria-label={t.floatingPanel.collapseOutline} className="floating-icon-button" onMouseDown={(e) => e.stopPropagation()} onClick={() => {
                  setSettingsOpen(false);
                  void updateViewState('collapsed');
                }}>
                  <ChevronUp className="size-4" />
                </button>
                <button type="button" aria-label={t.floatingPanel.close} title={t.floatingPanel.close} className="floating-icon-button" onMouseDown={(e) => e.stopPropagation()} onClick={() => void hideFloatingOutline()}>
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="floating-titlebar" onMouseDown={startWindowDragging}>
            <div className="floating-drag-handle">
              <ListTree className="size-4" /> <span>{outline.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label={t.floatingPanel.settings} className="floating-icon-button" onMouseDown={(e) => e.stopPropagation()} onClick={() => setSettingsOpen((value) => !value)}>
                <Settings2 className="size-4" />
              </button>
              <button type="button" aria-label={t.floatingPanel.expandOutline} className="floating-icon-button" onMouseDown={(e) => e.stopPropagation()} onClick={() => void updateViewState('chapters')}>
                <ChevronDown className="size-4" />
              </button>
              <button type="button" aria-label={t.floatingPanel.close} title={t.floatingPanel.close} className="floating-icon-button" onMouseDown={(e) => e.stopPropagation()} onClick={() => void hideFloatingOutline()}>
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {settingsOpen ? <motion.div key="settings" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="floating-settings">
            <div className="floating-setting-row"><span>{t.floatingPanel.layout}</span><div className="flex gap-1"><button type="button" className={`floating-choice ${settings.layout === 'vertical' ? 'active' : ''}`} onClick={() => void updateSettings({ layout: 'vertical' })}>{t.floatingPanel.vertical}</button><button type="button" className={`floating-choice ${settings.layout === 'horizontal' ? 'active' : ''}`} onClick={() => void updateSettings({ layout: 'horizontal' })}>{t.floatingPanel.horizontal}</button></div></div>
            <div className="floating-setting-group">
              <div className="floating-setting-row">
                <span>{t.floatingPanel.background}</span>
                <Palette className="size-3 opacity-70" />
              </div>
              <div className="floating-swatch-grid">
                {backgroundChoices.map((choice) => {
                  const label = t.floatingPanel.backgrounds[choice.labelKey];
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      className={`floating-swatch ${settings.background === choice.value ? 'active' : ''}`}
                      aria-label={`${t.floatingPanel.backgroundColor}: ${label}`}
                      title={label}
                      onClick={() => void updateSettings({ background: choice.value })}
                    >
                      <span style={{ background: choice.swatch }} />
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="floating-range">{t.floatingPanel.fontSize} <output>{settings.fontSize}px</output><input type="range" min="12" max="32" step="1" value={settings.fontSize} onChange={(e) => void updateSettings({ fontSize: Number(e.target.value) })} /></label>
            <label className="floating-range">{t.floatingPanel.opacity} <output>{Math.round(settings.opacity * 100)}%</output><input type="range" min="0.35" max="1" step="0.05" value={settings.opacity} onChange={(e) => void updateSettings({ opacity: Number(e.target.value) })} /></label>
            <label className="floating-range">{t.floatingPanel.blur} <output>{settings.blur}px</output><input type="range" min="0" max="40" step="1" value={settings.blur} onChange={(e) => void updateSettings({ blur: Number(e.target.value) })} /></label>
          </motion.div> : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {viewState !== 'collapsed' ? <motion.div key="chapters" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="floating-section">
            <div className={`floating-chapters floating-chapters-${settings.layout}`}>{outline.chapters.map((chapter, index) => <button key={chapter.id} type="button" className={`floating-chapter ${index === chapterIndex ? 'active' : ''}`} onClick={() => {
              if (viewState === 'detail' && index === safeIndex) {
                void updateViewState('chapters');
                return;
              }
              chapterIndexRef.current = index;
              setChapterIndex(index);
              void setFloatingChapterIndex(index);
              void updateViewState('detail');
            }}>{index + 1}. {chapter.title}</button>)}</div>
          </motion.div> : null}
        </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
