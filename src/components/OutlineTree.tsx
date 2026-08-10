import type { OutlineContent } from '@/types/outline';
import { ChapterEditor } from '@/components/Chapter';

interface OutlineTreeProps {
  content: OutlineContent;
  onChange: (content: OutlineContent) => void;
}

export function OutlineTree({ content, onChange }: OutlineTreeProps) {
  return (
    <div className="space-y-4">
      {content.chapters.map((chapter, index) => (
        <ChapterEditor
          key={chapter.id}
          chapter={chapter}
          index={index}
          onChange={(nextChapter) => {
            const chapters = [...content.chapters];
            chapters[index] = nextChapter;
            onChange({ ...content, chapters });
          }}
          onRemove={() => {
            onChange({
              ...content,
              chapters: content.chapters.filter((item) => item.id !== chapter.id),
            });
          }}
        />
      ))}
    </div>
  );
}
