import React from 'react';
import { PanelRightOpen, PanelRightClose, Zap } from 'lucide-react';
import { useBot } from '../context/BotContext';
import { BotTab } from '../types/bot.types';
import { MARKET_SYMBOLS } from '../constants/markets-and-strategies';

const TABS = [
  {
    id: BotTab.DASHBOARD,
    domId: 'id-dbot-dashboard',
    label: 'Dashboard',
    icon: '/assets/icons/IcDashboard.svg',
  },
  {
    id: BotTab.BOT_BUILDER,
    domId: 'id-bot-builder',
    label: 'Bot Builder',
    icon: '/assets/icons/IcBotBuilder.svg',
  },
  {
    id: BotTab.BOTS,
    domId: 'id-bots-vault',
    label: 'Bots',
    icon: '/assets/icons/IcBox.svg',
  },
  {
    id: BotTab.CHART,
    domId: 'id-charts',
    label: 'Charts',
    icon: '/assets/icons/IcChartsTabDbot.svg',
  },
  {
    id: BotTab.TUTORIAL,
    domId: 'id-tutorials',
    label: 'Tutorials',
    icon: '/assets/icons/IcTutorials.svg',
  },
];

export const SubHeaderTabs: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isDark,
    ticks,
    activeSymbol,
    isDrawerOpen,
    setIsDrawerOpen,
    openQuickStrategy,
    savedStrategies,
    isAutopilotArmed,
  } = useBot();

  const symMeta = MARKET_SYMBOLS.find(m => m.symbol === activeSymbol) || MARKET_SYMBOLS[0];
  const lastTick = ticks[ticks.length - 1];
  const prevTick = ticks[ticks.length - 2];
  const isUp = lastTick && prevTick ? lastTick.quote >= prevTick.quote : true;

  return (
    <div
      className={`h-11 border-b px-2 sm:px-5 flex items-center justify-between shrink-0 z-20 transition-colors ${
        isDark
          ? 'bg-[#151717] border-[#262a2e] text-slate-200'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      {/* Left: 5 Primary Workspace Tabs */}
      <div className="flex items-center h-full overflow-x-auto no-scrollbar gap-1 sm:gap-2">
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={t.domId}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`h-full px-3 sm:px-4 flex items-center gap-2 text-xs sm:text-[13px] border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? isDark
                    ? 'border-[#ff444f] text-white font-bold'
                    : 'border-[#ff444f] text-slate-900 font-bold'
                  : 'border-transparent font-medium opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={t.icon}
                alt=""
                className={`w-4 h-4 shrink-0 ${isDark ? 'invert brightness-150' : ''}`}
              />
              <span>{t.label}</span>
              {t.id === BotTab.BOTS && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    isAutopilotArmed
                      ? 'bg-[#3bf75a] text-slate-950'
                      : isDark
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isAutopilotArmed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                  )}
                  {savedStrategies.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Live Market Ticker + Quick Strategy Trigger + Run Panel Drawer Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        {lastTick && (
          <button
            type="button"
            onClick={() => setActiveTab(BotTab.CHART)}
            title="View live market chart"
            className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
              isDark
                ? 'bg-[#1d2125] border-[#2d333b] hover:border-slate-600'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="font-sans font-semibold opacity-75">{symMeta.shortCode}</span>
            <span className={`font-bold ${isUp ? 'text-emerald-500' : 'text-[#ff444f]'}`}>
              {lastTick.quote.toFixed(symMeta.pipSize)}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => openQuickStrategy()}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
            isDark
              ? 'bg-[#1d2125] border-[#2d333b] text-[#3bf75a] hover:bg-slate-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Quick Strategy</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          title={isDrawerOpen ? 'Hide Run Panel' : 'Open Run Panel'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
            isDrawerOpen
              ? 'bg-[#00a79e] border-[#00a79e] text-white'
              : isDark
              ? 'bg-[#1d2125] border-[#2d333b] text-slate-200 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isDrawerOpen ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Run Panel</span>
        </button>
      </div>
    </div>
  );
};
