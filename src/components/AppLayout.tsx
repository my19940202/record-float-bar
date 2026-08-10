import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: '首页' },
  { to: '/create', label: '创建提纲' },
  { to: '/settings', label: '设置' },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0,_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              AI Presentation Companion
            </p>
            <h1 className="text-xl font-semibold">Outline Helper</h1>
          </div>
          <nav className="flex items-center gap-2">
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
                    'rounded-xl px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-white/80'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
