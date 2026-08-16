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
import { messages, useI18n } from '@/lib/i18n';
import { getDmxSettings, saveDmxSettings } from '@/services/api';

export function SettingsPage() {
  const { setLanguage, t } = useI18n();
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
        setError(err instanceof Error ? err.message : messages.zh.settings.readError);
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
      setMessage(t.settings.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settings.saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border border-white/70 bg-white/45 px-6 py-7 shadow-[0_20px_60px_rgba(36,31,51,0.07)] backdrop-blur-xl sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c4dff]">
            {t.settings.eyebrow}
          </p>
          <h2 className="mt-2 text-4xl font-bold leading-tight">{t.settings.title}</h2>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {t.settings.description}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setLanguage((value) => (value === 'zh' ? 'en' : 'zh'))}
        >
          <Languages className="size-4" />
          {t.settings.language}
        </Button>
      </div>

      <Card className="space-y-4">
        <div>
          <CardTitle>{t.settings.cardTitle}</CardTitle>
          <CardDescription className="mt-1">
            {t.settings.cardDescription}
          </CardDescription>
        </div>

        {loading ? (
          <CardDescription>{t.settings.loading}</CardDescription>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="endpoint">{t.settings.endpoint}</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://www.dmxapi.cn/v1beta/models/gemini-3-flash-preview:generateContent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">{t.settings.apiKey}</Label>
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
            {saving ? t.settings.saving : t.settings.save}
          </Button>
        </div>
      </Card>
    </div>
  );
}
