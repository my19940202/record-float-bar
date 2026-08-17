import { getVersion } from '@tauri-apps/api/app';
import { load } from '@tauri-apps/plugin-store';
import type { Language } from '@/lib/i18n';

const TELEMETRY_ENDPOINT = 'https://democue.aizeten.me/api/app/heartbeat';
const STORE_PATH = 'settings.json';
const INSTALL_ID_KEY = 'telemetry.installId';
const LAST_HEARTBEAT_DATE_KEY = 'telemetry.lastHeartbeatDate';

let heartbeatPromise: Promise<void> | null = null;

export async function sendDailyTelemetryHeartbeat(language: Language) {
  if (heartbeatPromise) return heartbeatPromise;

  heartbeatPromise = sendDailyTelemetryHeartbeatOnce(language).finally(() => {
    heartbeatPromise = null;
  });

  return heartbeatPromise;
}

async function sendDailyTelemetryHeartbeatOnce(language: Language) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const store = await load(STORE_PATH, { autoSave: false });
    const lastHeartbeatDate = await store.get<string>(LAST_HEARTBEAT_DATE_KEY);

    if (lastHeartbeatDate === today) return;

    let installId = await store.get<string>(INSTALL_ID_KEY);
    if (!installId) {
      installId = crypto.randomUUID();
      await store.set(INSTALL_ID_KEY, installId);
    }

    const appVersion = await getVersion();
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        installId,
        appVersion,
        platform: getPlatform(),
        locale: language === 'zh' ? 'zh-CN' : 'en-US',
      }),
    });

    if (!response.ok) return;

    await store.set(LAST_HEARTBEAT_DATE_KEY, today);
    await store.save();
  } catch (error) {
    console.debug('[telemetry] heartbeat skipped:', error);
  }
}

function getPlatform() {
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  const value = `${platform} ${userAgent}`;

  if (value.includes('mac')) return 'macos';
  if (value.includes('win')) return 'windows';
  if (value.includes('linux')) return 'linux';
  return 'unknown';
}
