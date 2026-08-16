import { useEffect, useState } from 'react';
import { Languages, Save } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Input,
  Label,
} from '@/components/ui/primitives';
import { getDmxSettings, saveDmxSettings } from '@/services/api';

type SettingsLanguage = 'zh' | 'en';

const copy = {
  zh: {
    eyebrow: 'Local configuration',
    title: '设置',
    description: '配置 DMXAPI Gemini 中转站。密钥保存在本地，不会进入前端 bundle。',
    language: 'English',
    cardTitle: 'DMXAPI',
    cardDescription: '默认 endpoint 为 Gemini generateContent 接口。',
    endpoint: 'Endpoint',
    apiKey: 'API Key',
    loading: '加载中...',
    saved: '设置已保存',
    readError: '读取设置失败',
    saveError: '保存失败',
    saving: '保存中...',
    save: '保存设置',
  },
  en: {
    eyebrow: 'Local configuration',
    title: 'Settings',
    description:
      'Configure the DMXAPI Gemini relay. The key is stored locally and is never bundled into the frontend.',
    language: '中文',
    cardTitle: 'DMXAPI',
    cardDescription: 'The default endpoint uses the Gemini generateContent API.',
    endpoint: 'Endpoint',
    apiKey: 'API Key',
    loading: 'Loading...',
    saved: 'Settings saved',
    readError: 'Failed to read settings',
    saveError: 'Failed to save settings',
    saving: 'Saving...',
    save: 'Save settings',
  },
} satisfies Record<SettingsLanguage, Record<string, string>>;

export function SettingsPage() {
  const [language, setLanguage] = useState<SettingsLanguage>('zh');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const t = copy[language];

  useEffect(() => {
    void (async () => {
      try {
        const settings = await getDmxSettings();
        setEndpoint(settings.endpoint);
        setApiKey(settings.apiKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.zh.readError);
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
      setMessage(t.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-white/70 bg-white/45 px-6 py-7 shadow-[0_20px_60px_rgba(36,31,51,0.07)] backdrop-blur-xl sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c4dff]">
            {t.eyebrow}
          </p>
          <h2 className="mt-2 text-4xl font-bold leading-tight">{t.title}</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {t.description}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setLanguage((value) => (value === 'zh' ? 'en' : 'zh'))}
        >
          <Languages className="size-4" />
          {t.language}
        </Button>
      </div>

      <Card className="space-y-4">
        <div>
          <CardTitle>{t.cardTitle}</CardTitle>
          <CardDescription className="mt-1">
            {t.cardDescription}
          </CardDescription>
        </div>

        {loading ? (
          <CardDescription>{t.loading}</CardDescription>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">{t.endpoint}</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://www.dmxapi.cn/v1beta/models/gemini-3-flash-preview:generateContent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">{t.apiKey}</Label>
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
          <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button disabled={loading || saving} onClick={() => void handleSave()}>
            <Save className="size-4" />
            {saving ? t.saving : t.save}
          </Button>
        </div>
      </Card>
    </div>
  );
}
