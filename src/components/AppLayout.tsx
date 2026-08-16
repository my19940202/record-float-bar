import { Link, Outlet, useLocation } from 'react-router-dom';
import { MonitorPlay } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', labelKey: 'home' },
  { to: '/create', labelKey: 'create' },
  { to: '/settings', labelKey: 'settings' },
] as const;

export function AppLayout() {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,_rgba(244,255,63,0.22),_transparent_30rem),radial-gradient(circle_at_84%_8%,_rgba(234,220,255,0.72),_transparent_30rem),radial-gradient(circle_at_92%_42%,_rgba(158,216,255,0.48),_transparent_34rem),#fff9ee]">
      <header className="sticky top-0 z-40 px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-col items-stretch justify-between gap-3 rounded-[1.5rem] border border-[hsl(var(--border))] bg-white/72 px-4 py-3 shadow-[0_18px_45px_rgba(36,31,51,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#7c4dff,_#5933d6)] text-white shadow-[0_10px_24px_rgba(89,51,214,0.25)]">
              <MonitorPlay className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">
                {t.app.tagline}
              </p>
              <h1 className="truncate text-lg font-bold">{t.app.brand}</h1>
            </div>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-full bg-[#fff4e6]/70 p-1">
            {navItems.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    active
                      ? 'bg-white text-[#5933d6] shadow-sm'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-white/70 hover:text-[hsl(var(--foreground))]'
                  )}
                >
                  {t.nav[item.labelKey]}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-10 pt-4">
        <Outlet />
      </main>
    </div>
  );
}
