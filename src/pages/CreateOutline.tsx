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
          throw new Error('请填写主题');
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
        throw new Error('请上传 PDF / Markdown / TXT 文件');
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error('文件大小不能超过 10MB');
      }
      if (!isAcceptedFile(file)) {
        throw new Error('仅支持 PDF、Markdown、TXT');
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
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">创建提纲</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          支持纯文字输入，或上传 PDF / Markdown / TXT 让 AI 提炼讲解章节。
        </p>
      </div>

      <Card>
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'text' | 'file')}>
          <TabsList>
            <TabsTrigger value="text">文字输入</TabsTrigger>
            <TabsTrigger value="file">文件上传</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">主题</Label>
              <Input
                id="topic"
                placeholder="例如：我的 Cursor AI 开发流程"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">补充信息</Label>
              <Textarea
                id="notes"
                placeholder="面向程序员，预计 10 分钟，重点讲工作流和踩坑"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 px-6 py-10 text-center transition hover:bg-white"
            >
              <UploadCloud className="mb-3 size-8 text-[hsl(var(--primary))]" />
              <CardTitle className="text-base">
                {file ? file.name : '拖拽或点击上传文件'}
              </CardTitle>
              <CardDescription className="mt-2">
                支持 PDF / MD / TXT，最大 10MB
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
              <Label htmlFor="extra-notes">录制补充说明（可选）</Label>
              <Textarea
                id="extra-notes"
                placeholder="例如：面向新手，重点讲前 3 章"
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
                生成中...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
