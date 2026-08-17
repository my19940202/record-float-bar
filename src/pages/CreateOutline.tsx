import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Plus, Save } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  Input,
  Label,
  Textarea,
} from '@/components/ui/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OutlineTree } from '@/components/OutlineTree';
import { useI18n } from '@/lib/i18n';
import { generateOutline } from '@/services/api';
import { useOutlineStore } from '@/stores/outlineStore';
import type { OutlineContent } from '@/types/outline';
import { createChapterId } from '@/types/outline';

type CreateMode = 'ai' | 'manual';

export function CreateOutlinePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const setDraft = useOutlineStore((state) => state.setDraft);
  const saveDraft = useOutlineStore((state) => state.saveDraft);
  const [mode, setMode] = useState<CreateMode>('ai');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState<string>(
    t.create.manualDefaultTitle
  );
  const [manualContent, setManualContent] = useState<OutlineContent>(() => ({
    title: t.create.manualDefaultTitle,
    chapters: [
      {
        id: createChapterId(),
        title: t.create.manualDefaultChapter,
        points: [t.create.manualDefaultPoint],
      },
    ],
  }));

  useEffect(() => {
    setError(null);
  }, [mode, topic, notes, manualTitle, manualContent]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      if (!topic.trim()) {
        throw new Error(t.create.missingTopic);
      }
      const content = await generateOutline({
        mode: 'text',
        topic: topic.trim(),
        notes: notes.trim() || undefined,
      });
      setDraft(content);
      navigate('/edit/new', {
        state: {
          sourceType: 'text' as const,
          sourceName: null,
        },
      });
    } catch (err) {
      console.error('[generate_outline] failed:', err);
      setError(err instanceof Error ? err.message : t.create.generateError);
    } finally {
      setLoading(false);
    }
  }

  function updateManualTitle(nextTitle: string) {
    setManualTitle(nextTitle);
    setManualContent((current) => ({
      ...current,
      title: nextTitle,
    }));
  }

  function updateManualContent(nextContent: OutlineContent) {
    setManualContent(nextContent);
    setManualTitle(nextContent.title);
  }

  function addManualChapter() {
    setManualContent((current) => ({
      ...current,
      chapters: [
        ...current.chapters,
        {
          id: createChapterId(),
          title: t.edit.newChapter,
          points: [t.edit.defaultPoint],
        },
      ],
    }));
  }

  async function handleSaveManual() {
    setSaving(true);
    setError(null);
    try {
      const title = manualTitle.trim() || t.create.manualDefaultTitle;
      const content = {
        ...manualContent,
        title,
      };
      setDraft(content);
      const saved = await saveDraft({
        title,
        sourceType: 'text',
        sourceName: null,
      });
      navigate(`/edit/${saved.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.create.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-[1.75rem] border border-white/70 bg-white/45 px-6 py-7 shadow-[0_20px_60px_rgba(36,31,51,0.07)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c4dff]">
          {t.create.eyebrow}
        </p>
        <h2 className="mt-2 text-4xl font-bold leading-tight">{t.create.title}</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          {t.create.description}
        </p>
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as CreateMode)}>
        <TabsList>
          <TabsTrigger value="ai">{t.create.aiTab}</TabsTrigger>
          <TabsTrigger value="manual">{t.create.manualTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <Card>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">{t.create.topic}</Label>
                <Input
                  id="topic"
                  placeholder={t.create.topicPlaceholder}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t.create.notes}</Label>
                <Textarea
                  id="notes"
                  placeholder={t.create.notesPlaceholder}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>

            {error && mode === 'ai' ? (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end">
              <Button disabled={loading} onClick={() => void handleGenerate()}>
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {t.create.generating}
                  </>
                ) : (
                  t.create.generate
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card className="space-y-4">
            <CardDescription>{t.create.manualDescription}</CardDescription>
            <div className="space-y-2">
              <Label htmlFor="manual-outline-title">{t.create.manualTitle}</Label>
              <Input
                id="manual-outline-title"
                value={manualTitle}
                onChange={(event) => updateManualTitle(event.target.value)}
              />
            </div>
          </Card>

          <OutlineTree content={manualContent} onChange={updateManualContent} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={addManualChapter}>
              <Plus className="size-4" />
              {t.edit.addChapter}
            </Button>

            <Button disabled={saving} onClick={() => void handleSaveManual()}>
              <Save className="size-4" />
              {saving ? t.create.saving : t.create.save}
            </Button>
          </div>

          {error && mode === 'manual' ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
