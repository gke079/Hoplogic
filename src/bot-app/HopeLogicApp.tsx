import React from 'react';
import { X, Play, Pause, Square, Zap, Gauge } from 'lucide-react';
import { BotProvider, useBot } from './context/BotContext';
import { BotTab } from './types/bot.types';
import { Header } from './components/Header';
import { SubHeaderTabs } from './components/SubHeaderTabs';
import { DashboardView } from './components/DashboardView';
import { BotBuilderView } from './components/BotBuilderView';
import { BotsView } from './components/BotsView';
import { ChartsView } from './components/ChartsView';
import { TutorialsView } from './components/TutorialsView';
import { RunPanelDrawer } from './components/RunPanelDrawer';
import { QuickStrategyModal } from './components/QuickStrategyModal';
import { LoadSaveModals } from './components/LoadSaveModals';
import { Footer } from './components/Footer';

const WorkspaceShell: React.FC = () => {
  const {
    activeTab,
    isDark,
    toasts,
    dismissToast,
    isBotRunning,
    isBotPaused,
    executionMode,
    setExecutionMode,
    startBot,
    pauseBot,
    resumeBot,
    stopBot,
    isDrawerOpen,
    setIsDrawerOpen,
    statistics,
    activeAccount,
  } = useBot();

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0e1013] text-slate-100' : 'bg-[#f4f6f8] text-slate-900'
      }`}
    >
      {/* Top App Header */}
      <Header />

      {/* Deriv Bot 5-Tab Bar */}
      <SubHeaderTabs />

      {/* Main Content Area + Collapsible Right Run Panel */}
      <main className="flex-1 flex overflow-hidden relative">
        <div
          className={`flex-1 overflow-hidden ${
            !isDrawerOpen ? 'w-full' : 'hidden sm:block sm:flex-1'
          }`}
        >
          {activeTab === BotTab.DASHBOARD && <DashboardView />}
          {activeTab === BotTab.BOT_BUILDER && <BotBuilderView />}
          {activeTab === BotTab.BOTS && <BotsView />}
          {activeTab === BotTab.CHART && <ChartsView />}
          {activeTab === BotTab.TUTORIAL && <TutorialsView />}
        </div>

        <RunPanelDrawer />
      </main>

      {/* Mobile Bottom Quick Run Bar when Drawer is Closed */}
      {!isDrawerOpen && (
        <div
          className={`sm:hidden h-14 border-t px-3 flex items-center justify-between gap-2 shrink-0 z-20 ${
            isDark ? 'bg-[#15171a] border-[#262b33]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {!isBotRunning ? (
              <button
                type="button"
                onClick={() => startBot()}
                className="px-3.5 py-2 rounded-lg bg-[#00a79e] text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </button>
            ) : (
              <>
                {!isBotPaused ? (
                  <button
                    type="button"
                    onClick={() => pauseBot()}
                    className="px-3 py-2 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resumeBot()}
                    className="px-3 py-2 rounded-lg bg-[#00a79e] text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => stopBot()}
                  className="px-3 py-2 rounded-lg bg-[#ff444f] text-white font-bold text-xs flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setExecutionMode(executionMode === 'fast' ? 'normal' : 'fast')}
              className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                executionMode === 'fast'
                  ? 'bg-[#3bf75a] border-[#3bf75a] text-slate-950'
                  : isDark
                  ? 'bg-[#1d2125] border-[#2d333b] text-slate-200'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {executionMode === 'fast' ? (
                <>
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Fast</span>
                </>
              ) : (
                <>
                  <Gauge className="w-3 h-3" />
                  <span>Normal</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="text-xs font-mono font-bold truncate"
          >
            P/L:{' '}
            <span
              className={
                statistics.totalProfit > 0
                  ? 'text-emerald-500'
                  : statistics.totalProfit < 0
                  ? 'text-[#ff444f]'
                  : ''
              }
            >
              {statistics.totalProfit > 0 ? '+' : ''}
              {statistics.totalProfit.toFixed(2)} {activeAccount.currency}
            </span>
          </button>
        </div>
      )}

      {/* Desktop Footer */}
      <Footer />

      {/* Modals */}
      <QuickStrategyModal />
      <LoadSaveModals />

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-11 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-xl flex items-start justify-between gap-3 text-xs ${
                t.type === 'success'
                  ? isDark
                    ? 'bg-[#132620] border-emerald-500/40 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : t.type === 'error'
                  ? isDark
                    ? 'bg-[#2a1518] border-rose-500/40 text-rose-200'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                  : isDark
                  ? 'bg-[#1c2128] border-slate-700 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div>
                <div className="font-bold">{t.title}</div>
                {t.message && <div className="opacity-80 mt-0.5">{t.message}</div>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="p-0.5 opacity-60 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const HopeLogicApp: React.FC = () => (
  <BotProvider>
    <WorkspaceShell />
  </BotProvider>
);

export default HopeLogicApp;
