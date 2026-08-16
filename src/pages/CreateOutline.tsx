import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import {
  Button,
  Card,
  Input,
  Label,
  Textarea,
} from '@/components/ui/primitives';
import { useI18n } from '@/lib/i18n';
import { generateOutline } from '@/services/api';
import { useOutlineStore } from '@/stores/outlineStore';

export function CreateOutlinePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const setDraft = useOutlineStore((state) => state.setDraft);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [topic, notes]);

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-[1.75rem] border border-white/70 bg-white/45 px-6 py-7 shadow-[0_20px_60px_rgba(36,31,51,0.07)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c4dff]">
          {t.create.eyebrow}
        </p>
        <h2 className="mt-2 text-4xl font-bold leading-tight">{t.create.title}</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          {t.create.description}
        </p>
      </div>

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

        {error ? (
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
    </div>
  );
}
