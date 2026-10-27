import React, { useMemo, useState } from 'react';
import {
  Search,
  FolderOpen,
  Download,
  Copy,
  Trash2,
  Play,
  ArrowUpDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import { BotTab } from '../types/bot.types';
import { MARKET_SYMBOLS, QUICK_STRATEGIES } from '../constants/markets-and-strategies';

export const DashboardView: React.FC = () => {
  const {
    isDark,
    setActiveTab,
    openQuickStrategy,
    setIsLoadModalOpen,
    savedStrategies,
    loadStrategyIntoBuilder,
    downloadXmlForStrategy,
    duplicateSavedStrategy,
    deleteSavedStrategy,
    startBot,
  } = useBot();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const filteredStrategies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = savedStrategies.filter(
      s =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.symbol.toLowerCase().includes(q) ||
        s.strategySystem.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });
  }, [savedStrategies, searchQuery, sortBy]);

  const actionTiles = [
    {
      id: 'my-computer',
      title: 'My computer',
      subtitle: 'Upload local .xml bot',
      icon: '/assets/icons/IcMyComputer.svg',
      onClick: () => setIsLoadModalOpen(true),
    },
    {
      id: 'google-drive',
      title: 'Google Drive',
      subtitle: 'Import cloud strategies',
      icon: '/assets/icons/IcGoogleDriveDbot.svg',
      onClick: () => setIsLoadModalOpen(true),
    },
    {
      id: 'bot-builder',
      title: 'Bot Builder',
      subtitle: 'Build visually from scratch',
      icon: '/assets/icons/IcBotBuilder.svg',
      onClick: () => setActiveTab(BotTab.BOT_BUILDER),
    },
    {
      id: 'quick-strategy',
      title: 'Quick strategy',
      subtitle: '6 ready-made systems',
      icon: '/assets/icons/IcQuickStrategy.svg',
      onClick: () => openQuickStrategy(),
    },
  ];

  const formatRelativeTime = (ts: number) => {
    const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const hrs = Math.round(diffMin / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6 lg:py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section: Load or build your bot */}
        <section className="text-center space-y-2.5 pt-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Load or build your bot
          </h1>
          <p className="text-xs sm:text-sm opacity-70 max-w-2xl mx-auto">
            Import an existing Deriv Bot XML strategy from your computer, assemble custom logic blocks in the Bot Builder, or launch a pre-configured Quick Strategy in seconds.
          </p>

          {/* 4 Primary Deriv Bot Action Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-5 max-w-3xl mx-auto">
            {actionTiles.map(tile => (
              <button
                key={tile.id}
                type="button"
                onClick={tile.onClick}
                className={`group p-4 sm:p-5 rounded-xl border text-center flex flex-col items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 ${
                  isDark
                    ? 'bg-[#181b1f] border-[#292f36] hover:border-[#00a79e] hover:bg-[#1d2126]'
                    : 'bg-white border-slate-200 hover:border-[#00a79e] shadow-xs hover:shadow-md'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isDark
                      ? 'bg-[#22272e] group-hover:bg-[#00a79e]/20'
                      : 'bg-slate-100 group-hover:bg-teal-50'
                  }`}
                >
                  <img
                    src={tile.icon}
                    alt=""
                    className={`w-6 h-6 ${
                      tile.id !== 'google-drive' && isDark ? 'invert brightness-150' : ''
                    }`}
                  />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm">{tile.title}</div>
                  <div className="text-[11px] opacity-60 mt-0.5">{tile.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Quick Strategy Shortcut Strip */}
        <section
          className={`rounded-xl border p-4 sm:p-5 ${
            isDark ? 'bg-[#181b1f] border-[#292f36]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00a79e]" />
              <h2 className="font-bold text-sm">Popular Quick Strategies</h2>
            </div>
            <button
              type="button"
              onClick={() => openQuickStrategy()}
              className="text-xs font-semibold text-[#00a79e] hover:underline"
            >
              Configure parameters →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {QUICK_STRATEGIES.map(qs => (
              <button
                key={qs.id}
                type="button"
                onClick={() => openQuickStrategy(qs.id)}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between gap-2 ${
                  isDark
                    ? 'bg-[#121518] border-[#262b33] hover:border-[#00a79e]'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-[#00a79e] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs">{qs.label}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      qs.riskLevel === 'High'
                        ? 'bg-rose-500/15 text-rose-500'
                        : qs.riskLevel === 'Moderate'
                        ? 'bg-amber-500/15 text-amber-500'
                        : 'bg-emerald-500/15 text-emerald-500'
                    }`}
                  >
                    {qs.riskLevel} Risk
                  </span>
                </div>
                <p className="text-[11px] opacity-70 line-clamp-2">{qs.tagline}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Your Strategies Table / List */}
        <section
          className={`rounded-xl border overflow-hidden ${
            isDark ? 'bg-[#181b1f] border-[#292f36]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#262b33] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base">Your strategies</h2>
              <p className="text-xs opacity-65">
                Open a strategy in Bot Builder, run it immediately, or export standard Deriv Bot XML.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search strategies..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[#00a79e] ${
                    isDark
                      ? 'bg-[#111417] border-[#2d333b] text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={() => setSortBy(prev => (prev === 'recent' ? 'name' : 'recent'))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-[#111417] border-[#2d333b] hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortBy === 'recent' ? 'Recent' : 'A–Z'}</span>
              </button>
            </div>
          </div>

          {filteredStrategies.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <img
                src="/assets/icons/IcDbotNoSearchResult.svg"
                alt=""
                className="w-12 h-12 mx-auto opacity-60"
              />
              <div className="text-sm font-semibold">No matching strategies found</div>
              <p className="text-xs opacity-65">
                Try clearing your search filter or create a new bot in Bot Builder.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#262b33]">
              {filteredStrategies.map(item => {
                const sym = MARKET_SYMBOLS.find(m => m.symbol === item.symbol);
                return (
                  <div
                    key={item.id}
                    className={`px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isDark ? 'hover:bg-[#1e2228]' : 'hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm truncate">{item.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-300'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {sym?.shortCode || item.symbol}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#00a79e]/15 text-[#00a79e]">
                          {item.strategySystem.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] opacity-65">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.updatedAt)}
                        </span>
                        <span>Stake: {item.initialStake}</span>
                        <span>TP: +{item.takeProfit}</span>
                        <span>SL: -{item.stopLoss}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          loadStrategyIntoBuilder(item, true);
                          startBot(item);
                        }}
                        title="Load and Run bot immediately"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-semibold transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => loadStrategyIntoBuilder(item, true)}
                        title="Open in Bot Builder"
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          isDark
                            ? 'border-slate-700 hover:bg-slate-800'
                            : 'border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadXmlForStrategy(item)}
                        title="Download Deriv Bot .xml"
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'border-slate-700 hover:bg-slate-800'
                            : 'border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateSavedStrategy(item.id)}
                        title="Duplicate strategy"
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark
                            ? 'border-slate-700 hover:bg-slate-800'
                            : 'border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSavedStrategy(item.id)}
                        title="Delete strategy"
                        className={`p-1.5 rounded-lg border transition-colors text-rose-500 ${
                          isDark
                            ? 'border-slate-700 hover:bg-rose-500/15'
                            : 'border-slate-200 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
