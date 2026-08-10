import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, Trash2, MonitorUp } from 'lucide-react';
import { Button, Card, CardDescription, CardTitle } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { useOutlineStore } from '@/stores/outlineStore';
import { showFloatingOutline } from '@/services/api';

export function HomePage() {
  const { outlines, loading, error, fetchOutlines, removeOutline } =
    useOutlineStore();

  useEffect(() => {
    void fetchOutlines();
  }, [fetchOutlines]);

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">我的提纲</h2>
          <p className="mt-2 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
            生成结构化章节，录制时用悬浮窗快速扫读，减少反复重录。
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white"
        >
          <Plus className="size-4" />
          新建提纲
        </Link>
      </section>

      {loading ? (
        <Card>
          <CardDescription>加载中...</CardDescription>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-600">{error}</CardDescription>
        </Card>
      ) : null}

      {!loading && outlines.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-start gap-4">
            <div className="rounded-2xl bg-[hsl(var(--muted))] p-3">
              <Sparkles className="size-5" />
            </div>
            <div>
              <CardTitle>还没有提纲</CardTitle>
              <CardDescription className="mt-2">
                输入主题或上传 PDF / Markdown / TXT，让 AI 生成录制提纲。
              </CardDescription>
            </div>
            <Link
              to="/create"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white"
            >
              开始创建
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {outlines.map((outline) => (
          <Card key={outline.id} className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{outline.title}</CardTitle>
              <CardDescription className="mt-1">
                {outline.content.chapters.length} 个章节 ·{' '}
                {outline.source_type === 'file'
                  ? `文件：${outline.source_name || '附件'}`
                  : '文字输入'}{' '}
                · {formatDate(outline.updated_at)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => void showFloatingOutline(outline.id)}
              >
                <MonitorUp className="size-4" />
                展示
              </Button>
              <Link
                to={`/edit/${outline.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-white px-4 text-sm font-medium hover:bg-[hsl(var(--muted))]"
              >
                编辑
              </Link>
              <Button
                variant="ghost"
                onClick={() => void removeOutline(outline.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
