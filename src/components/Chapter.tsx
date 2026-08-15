import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X } from 'lucide-react';
import {
  Button,
  Card,
  CardTitle,
  Input,
  Label,
} from '@/components/ui/primitives';
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
            aria-label={`拖拽调整章节 ${index + 1} 的顺序`}
            title="拖拽调整顺序"
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
              {index + 1}. {chapter.title || '未命名章节'}
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
            aria-label={`删除章节 ${index + 1}`}
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
                  <Label>章节标题</Label>
                  <Input
                    value={chapter.title}
                    onChange={(event) =>
                      onChange({ ...chapter, title: event.target.value })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>讲解重点</Label>
                  {chapter.points.map((point, pointIndex) => (
                    <div
                      key={`${chapter.id}-${pointIndex}`}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={point}
                        aria-label={`讲解重点 ${pointIndex + 1}`}
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
                        aria-label={`删除讲解重点 ${pointIndex + 1}`}
                        title="删除讲解重点"
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
                        points: [...chapter.points, '新的讲解重点'],
                      })
                    }
                  >
                    <Plus className="size-4" />
                    添加重点
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
