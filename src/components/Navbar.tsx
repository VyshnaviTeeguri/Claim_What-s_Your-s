import { Bell, CheckCircle2, Home, ShieldCheck } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import { UI_COPY } from '../i18n/strings';

export function Navbar() {
  const { state, results, dispatch } = useAppState();
  const lang = state.language;
  const copy = UI_COPY[lang];
  const matchCount = results.filter((r) => r.verdict === 'MATCH').length;

  const navItems = [
    { to: '/', label: copy.navAssistant, icon: Home },
    {
      to: '/results',
      label: matchCount > 0 ? `${copy.navSchemes} (${matchCount})` : copy.navSchemes,
      icon: CheckCircle2,
    },
    {
      to: '/reminders',
      label:
        state.reminders.length > 0
          ? `${copy.navReminders} (${state.reminders.length})`
          : copy.navReminders,
      icon: Bell,
    },
    { to: '/privacy', label: copy.navPrivacy, icon: ShieldCheck },
  ];

  const toggleLanguage = () => {
    dispatch({ type: 'SET_LANGUAGE', language: lang === 'te' ? 'en' : 'te' });
  };

  return (
    <>
      {/* 1. HEADER: Sticky teal gradient bar, app name left, language toggle right */}
      <header className="sticky top-0 z-30 cwy-header-gradient text-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 min-h-[64px] py-2 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-[19px] sm:text-[21px] font-bold tracking-tight text-white whitespace-nowrap shrink-0 min-h-[48px] inline-flex items-center"
          >
            {copy.brandTitle}
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 text-[15px] font-semibold"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `min-h-[48px] inline-flex items-center px-2 border-b-2 whitespace-nowrap transition-colors tabular-nums ${
                    isActive
                      ? 'border-[#E8871E] text-white'
                      : 'border-transparent text-white/85 hover:text-white hover:border-white/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Small Language Toggle (తెలుగు / English) */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Switch language between Telugu and English"
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-[15px] font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            {lang === 'te' ? 'తెలుగు / English' : 'English / తెలుగు'}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Thumb Navigation (>= 48px tap targets, >= 15px text) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5DDD3] shadow-[0_-2px_10px_rgba(15,43,38,0.06)] pb-safe"
      >
        <div className="grid grid-cols-4 min-h-[60px] items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `min-h-[52px] flex flex-col items-center justify-center gap-0.5 px-1 text-[15px] font-semibold whitespace-nowrap transition-colors ${
                    isActive ? 'text-[#0F6B5C]' : 'text-[#64748B] hover:text-[#1F2A28]'
                  }`
                }
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="truncate max-w-full">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
