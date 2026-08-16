import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, UploadCloud } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui/primitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_BYTES,
  fileToBase64,
  fileToText,
  isAcceptedFile,
  mimeFromFileName,
} from '@/lib/utils';
import { generateOutline } from '@/services/api';
import { useOutlineStore } from '@/stores/outlineStore';

export function CreateOutlinePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const setDraft = useOutlineStore((state) => state.setDraft);
  const [tab, setTab] = useState<'text' | 'file'>('text');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [extraNotes, setExtraNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [tab]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'text') {
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
        return;
      }

      if (!file) {
        throw new Error(t.create.missingFile);
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(t.create.fileTooLarge);
      }
      if (!isAcceptedFile(file)) {
        throw new Error(t.create.unsupportedFile);
      }

      const mimeType = mimeFromFileName(file.name);
      const isPdf = mimeType === 'application/pdf';
      const content = await generateOutline({
        mode: 'file',
        fileName: file.name,
        mimeType,
        fileBase64: isPdf ? await fileToBase64(file) : undefined,
        fileText: isPdf ? undefined : await fileToText(file),
        extraNotes: extraNotes.trim() || undefined,
      });
      setDraft(content);
      navigate('/edit/new', {
        state: {
          sourceType: 'file' as const,
          sourceName: file.name,
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
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'text' | 'file')}>
          <TabsList>
            <TabsTrigger value="text">{t.create.textTab}</TabsTrigger>
            <TabsTrigger value="file">{t.create.fileTab}</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-[#7c4dff]/25 bg-[#fff4e6]/55 px-6 py-10 text-center transition hover:bg-white/78"
            >
              <UploadCloud className="mb-3 size-8 text-[hsl(var(--primary))]" />
              <CardTitle className="text-base">
                {file ? file.name : t.create.uploadTitle}
              </CardTitle>
              <CardDescription className="mt-2">
                {t.create.uploadDescription}
              </CardDescription>
              <input
                id="file-upload"
                type="file"
                accept={Object.values(ACCEPTED_FILE_TYPES).flat().join(',')}
                className="hidden"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setFile(next);
                }}
              />
            </label>
            <div className="space-y-2">
              <Label htmlFor="extra-notes">{t.create.extraNotes}</Label>
              <Textarea
                id="extra-notes"
                placeholder={t.create.extraNotesPlaceholder}
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

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
