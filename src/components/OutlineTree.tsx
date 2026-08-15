import { useEffect, useRef, useState } from 'react';
import { Reorder } from 'framer-motion';
import type { OutlineContent } from '@/types/outline';
import { ChapterEditor } from '@/components/Chapter';

interface OutlineTreeProps {
  content: OutlineContent;
  onChange: (content: OutlineContent) => void;
}

export function OutlineTree({ content, onChange }: OutlineTreeProps) {
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(
    content.chapters[0]?.id ?? null
  );
  const previousChapterIds = useRef(content.chapters.map((chapter) => chapter.id));

  useEffect(() => {
    const currentIds = content.chapters.map((chapter) => chapter.id);
    const addedId = currentIds.find((id) => !previousChapterIds.current.includes(id));

    if (addedId) {
      setExpandedChapterId(addedId);
      window.requestAnimationFrame(() => {
        document.getElementById(`chapter-card-${addedId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    } else if (
      expandedChapterId &&
      !currentIds.includes(expandedChapterId)
    ) {
      setExpandedChapterId(currentIds[0] ?? null);
    }

    previousChapterIds.current = currentIds;
  }, [content.chapters, expandedChapterId]);

  function reorderChapters(orderedIds: string[]) {
    const chaptersById = new Map(
      content.chapters.map((chapter) => [chapter.id, chapter])
    );
    const chapters = orderedIds
      .map((id) => chaptersById.get(id))
      .filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter));

    if (chapters.length === content.chapters.length) {
      onChange({ ...content, chapters });
    }
  }

  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={content.chapters.map((chapter) => chapter.id)}
      onReorder={reorderChapters}
      className="space-y-4"
    >
      {content.chapters.map((chapter, index) => (
        <ChapterEditor
          key={chapter.id}
          chapter={chapter}
          index={index}
          expanded={expandedChapterId === chapter.id}
          onToggle={() =>
            setExpandedChapterId((current) =>
              current === chapter.id ? null : chapter.id
            )
          }
          onChange={(nextChapter) => {
            const chapters = [...content.chapters];
            chapters[index] = nextChapter;
            onChange({ ...content, chapters });
          }}
          onRemove={() => {
            const chapters = content.chapters.filter(
              (item) => item.id !== chapter.id
            );
            if (expandedChapterId === chapter.id) {
              setExpandedChapterId(
                chapters[index]?.id ?? chapters[index - 1]?.id ?? null
              );
            }
            onChange({ ...content, chapters });
          }}
        />
      ))}
    </Reorder.Group>
  );
}
