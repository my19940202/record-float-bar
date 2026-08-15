export interface OutlineChapter {
  id: string;
  title: string;
  points: string[];
}

export interface OutlineContent {
  title: string;
  chapters: OutlineChapter[];
}

export interface OutlineRecord {
  id: number;
  title: string;
  source_type: 'text' | 'file';
  source_name: string | null;
  content: OutlineContent;
  created_at: string;
  updated_at: string;
}

export type GenerateMode = 'text' | 'file';

export interface GenerateOutlineTextPayload {
  mode: 'text';
  topic: string;
  notes?: string;
}

export interface GenerateOutlineFilePayload {
  mode: 'file';
  fileName: string;
  mimeType: string;
  fileBase64?: string;
  fileText?: string;
  extraNotes?: string;
}

export type GenerateOutlinePayload =
  | GenerateOutlineTextPayload
  | GenerateOutlineFilePayload;

export interface DmxSettings {
  endpoint: string;
  apiKey: string;
}

export type FloatingViewState = 'collapsed' | 'chapters' | 'detail';

export type FloatingTheme = 'light' | 'dark';
export type FloatingLayout = 'vertical' | 'horizontal';

export interface FloatingSettings {
  theme: FloatingTheme;
  layout: FloatingLayout;
  fontSize: number;
  opacity: number;
  blur: number;
}

export function createChapterId() {
  return crypto.randomUUID();
}

export function normalizeOutlineContent(raw: unknown): OutlineContent {
  if (!raw || typeof raw !== 'object') {
    throw new Error('提纲格式无效');
  }
  const value = raw as Record<string, unknown>;
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const chaptersRaw = Array.isArray(value.chapters) ? value.chapters : [];
  const chapters: OutlineChapter[] = [];

  for (const item of chaptersRaw) {
    if (!item || typeof item !== 'object') continue;
    const chapter = item as Record<string, unknown>;
    const chapterTitle =
      typeof chapter.title === 'string' ? chapter.title.trim() : '';
    const pointsRaw = Array.isArray(chapter.points) ? chapter.points : [];
    const points = pointsRaw
      .map((point) => (typeof point === 'string' ? point.trim() : ''))
      .filter(Boolean);
    if (!chapterTitle) continue;
    chapters.push({
      id:
        typeof chapter.id === 'string' && chapter.id
          ? chapter.id
          : createChapterId(),
      title: chapterTitle,
      points: points.length > 0 ? points : ['补充讲解要点'],
    });
  }

  if (!title && chapters.length === 0) {
    throw new Error('模型未返回有效提纲');
  }

  return {
    title: title || chapters[0]?.title || '未命名提纲',
    chapters,
  };
}
