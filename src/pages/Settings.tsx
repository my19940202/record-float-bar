import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Input,
  Label,
} from '@/components/ui/primitives';
import { getDmxSettings, saveDmxSettings } from '@/services/api';

export function SettingsPage() {
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const settings = await getDmxSettings();
        setEndpoint(settings.endpoint);
        setApiKey(settings.apiKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : '读取设置失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await saveDmxSettings({
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim(),
      });
      setMessage('设置已保存');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">设置</h2>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          配置 DMXAPI Gemini 中转站。密钥保存在本地，不会进入前端 bundle。
        </p>
      </div>

      <Card className="space-y-4">
        <div>
          <CardTitle>DMXAPI</CardTitle>
          <CardDescription className="mt-1">
            默认 endpoint 为 Gemini generateContent 接口。
          </CardDescription>
        </div>

        {loading ? (
          <CardDescription>加载中...</CardDescription>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://www.dmxapi.cn/v1beta/models/gemini-3-flash-preview:generateContent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
              />
            </div>
          </>
        )}

        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button disabled={loading || saving} onClick={() => void handleSave()}>
            <Save className="size-4" />
            {saving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
