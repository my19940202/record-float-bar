import { useEffect, useState } from 'react';
import { Languages, Palette, Save } from 'lucide-react';
import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Input,
  Label,
} from '@/components/ui/primitives';
import { defaultFloatingSettings, floatingBackgroundChoices } from '@/lib/floating-settings';
import { messages, useI18n } from '@/lib/i18n';
import {
  getDmxSettings,
  getFloatingSettings,
  saveDmxSettings,
  saveFloatingSettings,
} from '@/services/api';
import type { FloatingSettings } from '@/types/outline';

export function SettingsPage() {
  const { setLanguage, t } = useI18n();
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [floatingSettings, setFloatingSettings] = useState<FloatingSettings>(defaultFloatingSettings);
  const [loading, setLoading] = useState(true);
  const [floatingLoading, setFloatingLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [floatingSaving, setFloatingSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [floatingMessage, setFloatingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [floatingError, setFloatingError] = useState<string | null>(null);

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

  useEffect(() => {
    void (async () => {
      try {
        const settings = await getFloatingSettings();
        setFloatingSettings(settings);
      } catch (err) {
        setFloatingError(err instanceof Error ? err.message : messages.zh.settings.readError);
      } finally {
        setFloatingLoading(false);
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

  async function handleSaveFloating() {
    setFloatingSaving(true);
    setFloatingMessage(null);
    setFloatingError(null);
    try {
      await saveFloatingSettings(floatingSettings);
      setFloatingMessage(t.settings.floatingSaved);
    } catch (err) {
      setFloatingError(err instanceof Error ? err.message : t.settings.saveError);
    } finally {
      setFloatingSaving(false);
    }
  }

  function updateFloatingSettings(patch: Partial<FloatingSettings>) {
    setFloatingSettings((current) => ({ ...current, ...patch }));
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
                placeholder="https://api.deepseek.com/chat/completions"
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

      <Card className="space-y-4">
        <div>
          <CardTitle>{t.settings.floatingCardTitle}</CardTitle>
          <CardDescription className="mt-1">
            {t.settings.floatingCardDescription}
          </CardDescription>
        </div>

        {floatingLoading ? (
          <CardDescription>{t.settings.loading}</CardDescription>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <Label>{t.floatingPanel.layout}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={floatingSettings.layout === 'vertical' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => updateFloatingSettings({ layout: 'vertical' })}
                >
                  {t.floatingPanel.vertical}
                </Button>
                <Button
                  type="button"
                  variant={floatingSettings.layout === 'horizontal' ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => updateFloatingSettings({ layout: 'horizontal' })}
                >
                  {t.floatingPanel.horizontal}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{t.floatingPanel.background}</Label>
                <Palette className="size-4 opacity-70" />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {floatingBackgroundChoices.map((choice) => {
                  const label = t.floatingPanel.backgrounds[choice.labelKey];
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      className={`flex h-10 items-center justify-center rounded-xl border p-1 transition ${
                        floatingSettings.background === choice.value
                          ? 'border-[#7c4dff] bg-[#f3edff]'
                          : 'border-transparent hover:border-slate-200'
                      }`}
                      aria-label={`${t.floatingPanel.backgroundColor}: ${label}`}
                      title={label}
                      onClick={() => updateFloatingSettings({ background: choice.value })}
                    >
                      <span
                        className="block h-full w-full rounded-lg border border-slate-200/80"
                        style={{ background: choice.swatch }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="floating-font-size">
                {t.floatingPanel.fontSize} ({floatingSettings.fontSize}px)
              </Label>
              <input
                id="floating-font-size"
                type="range"
                min="12"
                max="32"
                step="1"
                value={floatingSettings.fontSize}
                onChange={(event) => updateFloatingSettings({ fontSize: Number(event.target.value) })}
                className="w-full accent-[#7c4dff]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floating-opacity">
                {t.floatingPanel.opacity} ({Math.round(floatingSettings.opacity * 100)}%)
              </Label>
              <input
                id="floating-opacity"
                type="range"
                min="0.35"
                max="1"
                step="0.05"
                value={floatingSettings.opacity}
                onChange={(event) => updateFloatingSettings({ opacity: Number(event.target.value) })}
                className="w-full accent-[#7c4dff]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floating-blur">
                {t.floatingPanel.blur} ({floatingSettings.blur}px)
              </Label>
              <input
                id="floating-blur"
                type="range"
                min="0"
                max="40"
                step="1"
                value={floatingSettings.blur}
                onChange={(event) => updateFloatingSettings({ blur: Number(event.target.value) })}
                className="w-full accent-[#7c4dff]"
              />
            </div>
          </>
        )}

        {floatingMessage ? (
          <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {floatingMessage}
          </p>
        ) : null}
        {floatingError ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {floatingError}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button disabled={floatingLoading || floatingSaving} onClick={() => void handleSaveFloating()}>
            <Save className="size-4" />
            {floatingSaving ? t.settings.saving : t.settings.saveFloating}
          </Button>
        </div>
      </Card>
    </div>
  );
}
