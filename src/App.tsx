import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { HomePage } from '@/pages/Home';
import { CreateOutlinePage } from '@/pages/CreateOutline';
import { EditOutlinePage } from '@/pages/EditOutline';
import { SettingsPage } from '@/pages/Settings';
import { FloatingOutlineWindow } from '@/windows/FloatingOutline';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { sendDailyTelemetryHeartbeat } from '@/services/telemetry';
import { useEffect } from 'react';

function MainApp() {
  const { language } = useI18n();

  useEffect(() => {
    void sendDailyTelemetryHeartbeat(language);
  }, [language]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/create" element={<CreateOutlinePage />} />
          <Route path="/edit/:id" element={<EditOutlinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const isFloating =
    window.location.pathname.endsWith('/floating.html') ||
    window.location.pathname === '/floating';

  return (
    <I18nProvider>
      {isFloating ? <FloatingOutlineWindow /> : <MainApp />}
    </I18nProvider>
  );
}
