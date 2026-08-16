import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X } from 'lucide-react';
import {
  Button,
  Card,
  CardTitle,
  Input,
  Label,
} from '@/components/ui/primitives';
import { interpolate, useI18n } from '@/lib/i18n';
import type { OutlineChapter } from '@/types/outline';

interface ChapterEditorProps {
  chapter: OutlineChapter;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (chapter: OutlineChapter) => void;
  onRemove: () => void;
}

export function ChapterEditor({
  chapter,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: ChapterEditorProps) {
  const dragControls = useDragControls();
  const { t } = useI18n();

  return (
    <Reorder.Item
      as="div"
      id={`chapter-card-${chapter.id}`}
      value={chapter.id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.01, zIndex: 20 }}
      className="relative list-none"
    >
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            aria-label={interpolate(t.chapter.dragChapter, { index: index + 1 })}
            title={t.chapter.dragTitle}
            className="cursor-grab touch-none rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] active:cursor-grabbing"
            onPointerDown={(event) => dragControls.start(event)}
          >
            <GripVertical className="size-4" />
          </button>

          <button
            type="button"
            className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-[hsl(var(--muted))]"
            aria-expanded={expanded}
            onClick={onToggle}
          >
            <CardTitle className="truncate text-base">
              {index + 1}. {chapter.title || t.chapter.untitled}
            </CardTitle>
            {expanded ? (
              <ChevronUp className="size-4 shrink-0" />
            ) : (
              <ChevronDown className="size-4 shrink-0" />
            )}
          </button>

          <Button
            variant="ghost"
            size="sm"
            aria-label={interpolate(t.chapter.deleteChapter, { index: index + 1 })}
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-4 border-t border-[hsl(var(--border))] px-5 py-4">
                <div className="space-y-2">
                  <Label>{t.chapter.chapterTitle}</Label>
                  <Input
                    value={chapter.title}
                    onChange={(event) =>
                      onChange({ ...chapter, title: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>{t.chapter.points}</Label>
                  {chapter.points.map((point, pointIndex) => (
                    <div
                      key={`${chapter.id}-${pointIndex}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={point}
                        aria-label={interpolate(t.chapter.pointLabel, {
                          index: pointIndex + 1,
                        })}
                        onChange={(event) => {
                          const points = [...chapter.points];
                          points[pointIndex] = event.target.value;
                          onChange({ ...chapter, points });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={interpolate(t.chapter.deletePoint, {
                          index: pointIndex + 1,
                        })}
                        title={interpolate(t.chapter.deletePoint, {
                          index: pointIndex + 1,
                        })}
                        onClick={() =>
                          onChange({
                            ...chapter,
                            points: chapter.points.filter(
                              (_, index) => index !== pointIndex
                            ),
                          })
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...chapter,
                        points: [...chapter.points, t.chapter.newPoint],
                      })
                    }
                  >
                    <Plus className="size-4" />
                    {t.chapter.addPoint}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </Reorder.Item>
  );
}

export { ChapterEditor as Chapter };
