import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Save, MonitorUp } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  Input,
  Label,
} from '@/components/ui/primitives';
import { OutlineTree } from '@/components/OutlineTree';
import { useI18n } from '@/lib/i18n';
import { getOutline, showFloatingOutline } from '@/services/api';
import { useOutlineStore } from '@/stores/outlineStore';
import type { OutlineContent } from '@/types/outline';
import { createChapterId } from '@/types/outline';

type EditLocationState = {
  sourceType?: 'text' | 'file';
  sourceName?: string | null;
};

export function EditOutlinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const location = useLocation();
  const state = (location.state as EditLocationState | null) ?? {};
  const draft = useOutlineStore((store) => store.draft);
  const setDraft = useOutlineStore((store) => store.setDraft);
  const saveDraft = useOutlineStore((store) => store.saveDraft);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<OutlineContent | null>(null);
  const [sourceType, setSourceType] = useState<'text' | 'file'>('text');
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    if (id !== 'new') return;
    if (!draft) {
      navigate('/create', { replace: true });
      return;
    }
    setTitle(draft.title);
    setContent(draft);
    setSourceType(state.sourceType ?? 'text');
    setSourceName(state.sourceName ?? null);
  }, [draft, id, navigate, state.sourceName, state.sourceType]);

  useEffect(() => {
    if (!id || id === 'new') return;
    const numericId = Number(id);
    if (!numericId) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const outline = await getOutline(numericId);
        if (cancelled) return;
        setTitle(outline.title);
        setContent(outline.content);
        setSourceType(outline.source_type);
        setSourceName(outline.source_name);
        setSavedId(outline.id);
        setDraft(outline.content);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t.edit.loadError);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, setDraft]);

  function updateContent(next: OutlineContent) {
    setContent(next);
    setDraft(next);
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await saveDraft({
        id: savedId ?? undefined,
        title: title.trim() || content.title,
        sourceType,
        sourceName,
      });
      setSavedId(saved.id);
      navigate(`/edit/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.edit.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !content) {
    return (
      <Card>
        <CardDescription>{loading ? t.edit.loading : t.edit.notFound}</CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-white/70 bg-white/45 px-6 py-7 shadow-[0_20px_60px_rgba(36,31,51,0.07)] backdrop-blur-xl sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c4dff]">
            {t.edit.eyebrow}
          </p>
          <h2 className="mt-2 text-4xl font-bold leading-tight">{t.edit.title}</h2>
          <CardDescription className="mt-2">
            {t.edit.description}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {savedId ? (
            <Button
              variant="secondary"
              onClick={() => void showFloatingOutline(savedId)}
            >
              <MonitorUp className="size-4" />
              {t.edit.show}
            </Button>
          ) : null}
          <Button disabled={saving} onClick={() => void handleSave()}>
            <Save className="size-4" />
            {saving ? t.edit.saving : t.edit.save}
          </Button>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="outline-title">{t.edit.outlineTitle}</Label>
          <Input
            id="outline-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <CardDescription>
          {t.edit.source}: {sourceType === 'file' ? sourceName || t.edit.file : t.edit.textInput}
        </CardDescription>
      </Card>

      <OutlineTree content={content} onChange={updateContent} />

      <Button
        variant="outline"
        onClick={() =>
          updateContent({
            ...content,
            chapters: [
              ...content.chapters,
              {
                id: createChapterId(),
                title: t.edit.newChapter,
                points: [t.edit.defaultPoint],
              },
            ],
          })
        }
      >
        <Plus className="size-4" />
        {t.edit.addChapter}
      </Button>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
