import { Trash2, Plus } from 'lucide-react';
import {
  Button,
  Card,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui/primitives';
import type { OutlineChapter } from '@/types/outline';

interface ChapterEditorProps {
  chapter: OutlineChapter;
  index: number;
  onChange: (chapter: OutlineChapter) => void;
  onRemove: () => void;
}

export function ChapterEditor({
  chapter,
  index,
  onChange,
  onRemove,
}: ChapterEditorProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>
          {index + 1}. {chapter.title || '未命名章节'}
        </CardTitle>
        <Button variant="ghost" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>

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
          <Textarea
            key={`${chapter.id}-${pointIndex}`}
            value={point}
            onChange={(event) => {
              const points = [...chapter.points];
              points[pointIndex] = event.target.value;
              onChange({ ...chapter, points });
            }}
          />
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
    </Card>
  );
}

export { ChapterEditor as Chapter };
