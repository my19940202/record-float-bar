import { useEffect, useRef, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { currentMonitor, getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { FloatingSettings, FloatingViewState, OutlineContent } from '@/types/outline';
import {
  getFloatingSettings,
  getFloatingState,
  hideFloatingOutline,
  setFloatingChapterIndex,
  setFloatingViewState,
} from '@/services/api';
import { defaultFloatingSettings } from '@/lib/floating-settings';
import { useI18n } from '@/lib/i18n';

interface FloatingPanelProps { outline: OutlineContent }

interface HorizontalResizeState {
  direction: 'west' | 'east';
  pointerId: number;
  startScreenX: number;
  startX: number;
  startY: number;
  startWidth: number;
  height: number;
}

/** 详情弹层相对章节条的位置：靠屏幕底部时在上方，靠顶部时在下方 */
type DetailPlacement = 'above' | 'below';

function normalizeViewState(viewState: FloatingViewState): FloatingViewState {
  return viewState === 'collapsed' ? 'chapters' : viewState;
}

export function FloatingPanel({ outline }: FloatingPanelProps) {
  const { t } = useI18n();
  const [viewState, setViewStateLocal] = useState<FloatingViewState>('chapters');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [settings, setSettings] = useState<FloatingSettings>(defaultFloatingSettings);
  const [detailMaxHeight, setDetailMaxHeight] = useState(280);
  const [detailPlacement, setDetailPlacement] = useState<DetailPlacement>('above');
  const chapterIndexRef = useRef(0);
  const resizeState = useRef<HorizontalResizeState | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  /** 窗口增高时钉哪条边：above→钉底边向上长，below→钉顶边向下长 */
  const resizeAnchorRef = useRef<'top' | 'bottom'>('bottom');
  const detailPlacementRef = useRef<DetailPlacement>('above');
  const moveUnlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    const sync = async () => {
      const [state, storedSettings] = await Promise.all([getFloatingState(), getFloatingSettings()]);
      if (!mounted) return;
      const nextViewState = normalizeViewState(state.viewState);
      setViewStateLocal(nextViewState);
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
    resizeAnchorRef.current = detailPlacement === 'below' ? 'top' : 'bottom';
  }, [detailPlacement]);

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

      if (resizeAnchorRef.current === 'bottom') {
        const bottom = logicalPosition.y + logicalSize.height;
        await Promise.all([
          appWindow.setSize(new LogicalSize(logicalSize.width, targetHeight)),
          appWindow.setPosition(
            new LogicalPosition(logicalPosition.x, bottom - targetHeight)
          ),
        ]);
        return;
      }

      await appWindow.setSize(new LogicalSize(logicalSize.width, targetHeight));
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
    if (viewState !== 'detail') return;

    let disposed = false;
    void getCurrentWindow()
      .onMoved(async () => {
        if (disposed) return;
        const placement = await resolveDetailPlacement();
        detailPlacementRef.current = placement;
        setDetailPlacement(placement);
      })
      .then((unlisten) => {
        if (disposed) {
          unlisten();
        } else {
          moveUnlistenRef.current = unlisten;
        }
      });

    return () => {
      disposed = true;
      moveUnlistenRef.current?.();
      moveUnlistenRef.current = null;
    };
  }, [viewState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && viewState === 'detail') {
        void updateViewState('chapters');
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
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
  }, [viewState]);

  const safeIndex = Math.min(Math.max(chapterIndex, 0), Math.max(outline.chapters.length - 1, 0));
  const activeChapter = outline.chapters[safeIndex];
  const panelStyle = {
    '--floating-opacity': settings.opacity,
    '--floating-blur': `${settings.blur}px`,
    '--floating-font-size': `${settings.fontSize}px`,
    '--floating-detail-max-height': `${detailMaxHeight}px`,
  } as React.CSSProperties;

  async function resolveDetailPlacement(): Promise<DetailPlacement> {
    const [monitor, position, size, scaleFactor] = await Promise.all([
      currentMonitor(),
      getCurrentWindow().outerPosition(),
      getCurrentWindow().innerSize(),
      getCurrentWindow().scaleFactor(),
    ]);
    if (!monitor) return 'above';

    const logicalPosition = position.toLogical(scaleFactor);
    const panelRect = panelRef.current?.getBoundingClientRect();
    const anchorY = panelRect
      ? logicalPosition.y + panelRect.top + panelRect.height / 2
      : logicalPosition.y + size.toLogical(scaleFactor).height / 2;

    const workAreaTop = monitor.workArea.position.y / monitor.scaleFactor;
    const workAreaHeight = monitor.workArea.size.height / monitor.scaleFactor;
    const workAreaMid = workAreaTop + workAreaHeight / 2;

    return anchorY > workAreaMid ? 'above' : 'below';
  }

  async function lockDetailPlacement() {
    const placement = await resolveDetailPlacement();
    detailPlacementRef.current = placement;
    setDetailPlacement(placement);
  }

  async function updateViewState(next: FloatingViewState) {
    const normalized = normalizeViewState(next);
    if (normalized === 'detail') {
      await lockDetailPlacement();
    }
    setViewStateLocal(normalized);
    await setFloatingViewState(normalized);
  }

  async function navigateChapter(direction: -1 | 1) {
    if (outline.chapters.length === 0) return;
    const nextIndex = Math.min(
      Math.max(chapterIndexRef.current + direction, 0),
      outline.chapters.length - 1
    );
    chapterIndexRef.current = nextIndex;
    setChapterIndex(nextIndex);
    await lockDetailPlacement();
    setViewStateLocal('detail');
    await Promise.all([
      setFloatingChapterIndex(nextIndex),
      setFloatingViewState('detail'),
    ]);
  }

  function startWindowDragging(event: React.MouseEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest('button, a, input, textarea, select, [contenteditable="true"]')
    ) {
      return;
    }
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

  const showDetailPopover =
    viewState === 'detail'
    && activeChapter
    && activeChapter.points.length > 0;
  const detailBelow = detailPlacement === 'below';

  const detailPopover = showDetailPopover ? (
    <motion.div
      key={activeChapter.id}
      initial={{ opacity: 0, y: detailBelow ? -10 : 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: detailBelow ? -8 : 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`floating-detail-popover ${detailBelow ? 'floating-detail-popover-below' : ''}`}
      onMouseDown={startWindowDragging}
    >
      <div className="floating-detail-header">
        <p>{activeChapter.title}</p>
        <button
          type="button"
          aria-label={t.floatingPanel.collapseDetail}
          title={t.floatingPanel.collapseDetail}
          className="floating-icon-button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => void updateViewState('chapters')}
        >
          {detailBelow ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
      <ul className="floating-detail-body floating-points">
        {activeChapter.points.map((point) => (
          <li key={point}>• {point}</li>
        ))}
      </ul>
    </motion.div>
  ) : null;

  return (
    <div
      className={`floating-shell floating-light floating-bg-${settings.background} ${detailBelow && showDetailPopover ? 'floating-shell-detail-below' : ''}`}
      style={panelStyle}
    >
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
        className={`floating-stack ${settings.layout === 'horizontal' ? 'floating-horizontal' : 'floating-vertical'} ${detailBelow && showDetailPopover ? 'floating-stack-detail-below' : ''}`}
      >
        {detailPlacement === 'above' ? (
          <AnimatePresence initial={false} mode="wait">
            {detailPopover}
          </AnimatePresence>
        ) : null}

        <motion.div
          ref={panelRef}
          layout
          className={`glass-panel floating-panel floating-panel-expanded ${settings.layout === 'horizontal' ? 'floating-horizontal' : 'floating-vertical'}`}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          onMouseDown={startWindowDragging}
        >
          <div className="floating-close-chrome">
            <button
              type="button"
              aria-label={t.floatingPanel.close}
              title={t.floatingPanel.close}
              className="floating-icon-button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => void hideFloatingOutline()}
            >
              <X className="size-4" />
            </button>
          </div>

          <motion.div className="floating-section">
            <div className={`floating-chapters floating-chapters-${settings.layout}`}>
              {outline.chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  className={`floating-chapter ${index === chapterIndex ? 'active' : ''}`}
                  onClick={() => {
                    if (viewState === 'detail' && index === safeIndex) {
                      void updateViewState('chapters');
                      return;
                    }
                    chapterIndexRef.current = index;
                    setChapterIndex(index);
                    void setFloatingChapterIndex(index);
                    void updateViewState('detail');
                  }}
                >
                  {index + 1}. {chapter.title}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {detailPlacement === 'below' ? (
          <AnimatePresence initial={false} mode="wait">
            {detailPopover}
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
}
