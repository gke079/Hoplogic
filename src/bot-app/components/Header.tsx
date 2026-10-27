import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  RotateCcw,
  KeyRound,
  Check,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import brandConfig from '../../../brand.config.json';
import { useBot } from '../context/BotContext';
import { BotTab } from '../types/bot.types';

export const Header: React.FC = () => {
  const {
    accounts,
    activeAccount,
    switchAccount,
    resetDemoBalance,
    connectDerivToken,
    authError,
    clearAuthError,
    isDark,
    toggleTheme,
    isSoundEnabled,
    toggleSound,
    activeTab,
    setActiveTab,
    isBotRunning,
  } = useBot();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [switcherTab, setSwitcherTab] = useState<'demo' | 'real'>('demo');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const appName =
    import.meta.env.VITE_DERIV_APP_NAME?.trim() || brandConfig.platform.name || 'HOPELOGIC';
  const showName = brandConfig.platform.show_name ?? true;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const formatBalance = (amount: number, currency: string) => {
    if (currency === 'BTC') {
      return `${amount.toFixed(5)} BTC`;
    }
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currency}`;
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiTokenInput.trim()) return;
    connectDerivToken(apiTokenInput.trim());
  };

  const realAccounts = accounts.filter(a => !a.isDemo || a.isApiConnected);
  const demoAccounts = accounts.filter(a => a.isDemo && !a.isApiConnected);

  return (
    <>
      <header
        className={`h-14 border-b px-3 lg:px-5 flex items-center justify-between select-none shrink-0 z-30 transition-colors ${
          isDark
            ? 'bg-[#151717] border-[#262a2e] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Left: Mobile Menu + Brand LogoMark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`lg:hidden p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(BotTab.DASHBOARD)}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-105"
              style={{ backgroundColor: brandConfig.colors.primary, color: '#0f172a' }}
            >
              {appName.charAt(0).toUpperCase()}
            </div>
            {showName && (
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base">{appName}</span>
                <span
                  className={`hidden sm:inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  BOT
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Right: Quick Controls + Account Switcher + Connect Deriv */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Running Indicator */}
          {isBotRunning && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Bot Running</span>
            </div>
          )}

          {/* Sound & Theme quick buttons on mobile/tablet */}
          <button
            type="button"
            onClick={toggleSound}
            title={isSoundEnabled ? 'Mute trade sounds' : 'Enable trade sounds'}
            className={`p-2 rounded-md transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-300'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-60" />}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className={`lg:hidden p-2 rounded-md transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-300'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Account Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(prev => !prev)}
              className={`flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-left transition-colors ${
                isDark
                  ? 'bg-[#1e2226] border-[#2e343b] hover:border-slate-500'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  activeAccount.isDemo ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
              />
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70 flex items-center gap-1">
                  <span>{activeAccount.isDemo ? 'Demo' : 'Real'}</span>
                  <span className="hidden sm:inline font-mono">• {activeAccount.loginid}</span>
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono">
                  {formatBalance(activeAccount.balance, activeAccount.currency)}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 opacity-70 transition-transform ${
                  isSwitcherOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isSwitcherOpen && (
              <div
                className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50 ${
                  isDark
                    ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                {/* Tabs: Demo | Real */}
                <div
                  className={`grid grid-cols-2 border-b text-xs font-semibold ${
                    isDark ? 'border-[#2d333b]' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSwitcherTab('demo')}
                    className={`py-2.5 text-center border-b-2 transition-colors ${
                      switcherTab === 'demo'
                        ? 'border-[#00a79e] text-[#00a79e]'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    Demo Accounts
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwitcherTab('real')}
                    className={`py-2.5 text-center border-b-2 transition-colors ${
                      switcherTab === 'real'
                        ? 'border-[#00a79e] text-[#00a79e]'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    Deriv API Accounts
                  </button>
                </div>

                {switcherTab === 'demo' ? (
                  <div className="p-2.5 space-y-1.5">
                    {demoAccounts.map(acc => {
                      const selected = acc.loginid === activeAccount.loginid;
                      return (
                        <button
                          key={acc.loginid}
                          type="button"
                          onClick={() => {
                            switchAccount(acc.loginid);
                            setIsSwitcherOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                            selected
                              ? isDark
                                ? 'bg-[#00a79e]/15 border border-[#00a79e]/40'
                                : 'bg-teal-50 border border-teal-200'
                              : isDark
                              ? 'hover:bg-slate-800/70'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              <span>{acc.label}</span>
                              {selected && <Check className="w-3.5 h-3.5 text-[#00a79e]" />}
                            </div>
                            <div className="text-[11px] font-mono opacity-60">{acc.loginid}</div>
                          </div>
                          <div className="text-xs font-bold font-mono">
                            {formatBalance(acc.balance, acc.currency)}
                          </div>
                        </button>
                      );
                    })}

                    {activeAccount.isDemo && (
                      <div
                        className={`pt-2 mt-2 border-t flex items-center justify-between px-1 ${
                          isDark ? 'border-slate-800' : 'border-slate-100'
                        }`}
                      >
                        <span className="text-[11px] opacity-65">Virtual execution funds</span>
                        <button
                          type="button"
                          onClick={() => {
                            resetDemoBalance();
                            setIsSwitcherOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#00a79e] hover:underline"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset Balance
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 space-y-2.5">
                    {realAccounts.length > 0 ? (
                      realAccounts.map(acc => {
                        const selected = acc.loginid === activeAccount.loginid;
                        return (
                          <button
                            key={acc.loginid}
                            type="button"
                            onClick={() => {
                              switchAccount(acc.loginid);
                              setIsSwitcherOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left ${
                              selected
                                ? 'bg-emerald-500/15 border border-emerald-500/40'
                                : isDark
                                ? 'hover:bg-slate-800'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold">{acc.label}</div>
                              <div className="text-[11px] font-mono opacity-60">{acc.loginid}</div>
                            </div>
                            <div className="text-xs font-bold font-mono">
                              {formatBalance(acc.balance, acc.currency)}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs opacity-70 leading-relaxed">
                        Authorize a Deriv API Token (`read`, `trade` scopes) to sync your live or virtual Deriv account balance.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        clearAuthError();
                        setIsTokenModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-[#ff444f] hover:bg-[#e53943] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Connect Deriv API Token
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              clearAuthError();
              setIsTokenModalOpen(true);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#ff444f] hover:bg-[#e03842] text-white transition-colors shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Deriv Auth</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div
            className={`relative w-72 max-w-[82vw] h-full p-4 flex flex-col justify-between z-10 ${
              isDark ? 'bg-[#151717] text-slate-100' : 'bg-white text-slate-900'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs text-slate-900"
                    style={{ backgroundColor: brandConfig.colors.primary }}
                  >
                    {appName.charAt(0)}
                  </div>
                  <span className="font-bold text-sm">{appName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-200/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {[
                  { tab: BotTab.DASHBOARD, label: 'Dashboard' },
                  { tab: BotTab.BOT_BUILDER, label: 'Bot Builder' },
                  { tab: BotTab.CHART, label: 'Charts' },
                  { tab: BotTab.TUTORIAL, label: 'Tutorials' },
                ].map(item => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.tab);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.tab
                        ? 'bg-[#00a79e]/15 text-[#00a79e] font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span>Appearance</span>
                <span className="font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Deriv API Token / OAuth Modal */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00a79e]" />
                <h3 className="font-bold text-sm">Connect Deriv Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTokenModalOpen(false)}
                className="p-1 rounded-md opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSubmit} className="p-5 space-y-4">
              <p className="text-xs opacity-75 leading-relaxed">
                Your workspace is already connected to Deriv&apos;s live market feed with a pre-funded{' '}
                <strong>$10,000 Demo Account</strong>. To authorize your personal Deriv account via WebSocket, enter a Deriv API Token with{' '}
                <code className="px-1 py-0.5 rounded bg-slate-500/15">read</code> scope.
              </p>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Deriv API Token</label>
                <input
                  type="password"
                  value={apiTokenInput}
                  onChange={e => setApiTokenInput(e.target.value)}
                  placeholder="Enter your Deriv API token..."
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00a79e] ${
                    isDark
                      ? 'bg-[#101316] border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
                  {authError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://app.deriv.com/account/api-token"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#00a79e] hover:underline"
                >
                  <span>Get Deriv Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTokenModalOpen(false)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold border ${
                      isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Continue in Demo
                  </button>
                  <button
                    type="submit"
                    disabled={!apiTokenInput.trim()}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00a79e] hover:bg-[#008f87] disabled:opacity-45 text-white transition-colors"
                  >
                    Authorize
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
