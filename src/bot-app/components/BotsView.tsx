import React, { useMemo, useRef, useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  Square,
  Zap,
  Gauge,
  Clock,
  Star,
  Plus,
  Upload,
  Download,
  Copy,
  Trash2,
  SlidersHorizontal,
  Wrench,
  Search,
  Power,
  Link2,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import {
  AutomationTriggerType,
  BotExecutionMode,
  BotStrategyConfig,
  ContractDirection,
  MarketCategory,
  PurchaseConditionType,
  StrategySystemType,
  TradeTypeGroup,
} from '../types/bot.types';
import {
  DEFAULT_STRATEGY,
  MARKET_SYMBOLS,
  QUICK_STRATEGIES,
  TRADE_TYPE_OPTIONS,
} from '../constants/markets-and-strategies';

type FilterMode = 'all' | 'automated' | 'favorites' | 'running';
type SortMode = 'recent' | 'profit' | 'winrate' | 'name';

export const BotsView: React.FC = () => {
  const {
    isDark,
    strategy,
    savedStrategies,
    saveCurrentStrategy,
    createStoredBot,
    updateSavedBot,
    toggleSavedBotFavorite,
    deleteSavedStrategy,
    duplicateSavedStrategy,
    loadStrategyIntoBuilder,
    downloadXmlForStrategy,
    importXmlContent,
    automations,
    getAutomationForBot,
    updateBotAutomation,
    isAutopilotArmed,
    setIsAutopilotArmed,
    botLifetimeStats,
    resetBotLifetimeStats,
    isBotRunning,
    isBotPaused,
    executionMode,
    setExecutionMode,
    startBot,
    pauseBot,
    resumeBot,
    stopBot,
    activeAccount,
    pushToast,
  } = useBot();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [configBotId, setConfigBotId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create New Bot Modal Form State
  const [newName, setNewName] = useState('Volatility Scalper Bot');
  const [newDesc, setNewDesc] = useState('Automated synthetic index strategy');
  const [newSymbol, setNewSymbol] = useState<string>('1HZ100V');
  const [newTradeType, setNewTradeType] = useState<TradeTypeGroup>('ups_downs');
  const [newDirection, setNewDirection] = useState<ContractDirection>('CALL');
  const [newCondition, setNewCondition] = useState<PurchaseConditionType>('sma_cross');
  const [newSystem, setNewSystem] = useState<StrategySystemType>('MARTINGALE');
  const [newStake, setNewStake] = useState<number>(1);
  const [newDuration, setNewDuration] = useState<number>(2);
  const [newTp, setNewTp] = useState<number>(25);
  const [newSl, setNewSl] = useState<number>(50);
  const [newAutoEnable, setNewAutoEnable] = useState<boolean>(true);
  const [newExecMode, setNewExecMode] = useState<BotExecutionMode>('fast');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const armedAutomationsCount = useMemo(() => {
    return savedStrategies.filter(b => automations[b.id]?.enabled).length;
  }, [automations, savedStrategies]);

  const vaultAggregate = useMemo(() => {
    let totalTrades = 0;
    let totalWins = 0;
    let netProfit = 0;
    for (const bot of savedStrategies) {
      const st = botLifetimeStats[bot.id];
      if (!st) continue;
      totalTrades += st.totalTrades;
      totalWins += st.wins;
      netProfit += st.netProfit;
    }
    const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;
    return {
      totalTrades,
      winRate,
      netProfit: Number(netProfit.toFixed(2)),
    };
  }, [botLifetimeStats, savedStrategies]);

  const filteredBots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = savedStrategies.filter(bot => {
      const rule = automations[bot.id];
      const isThisRunning = isBotRunning && strategy.id === bot.id;

      if (filterMode === 'automated' && !rule?.enabled) return false;
      if (filterMode === 'favorites' && !bot.isFavorite) return false;
      if (filterMode === 'running' && !isThisRunning) return false;

      if (!q) return true;
      const symMeta = MARKET_SYMBOLS.find(m => m.symbol === bot.symbol);
      return (
        bot.name.toLowerCase().includes(q) ||
        bot.symbol.toLowerCase().includes(q) ||
        (symMeta?.displayName.toLowerCase().includes(q) ?? false) ||
        bot.strategySystem.toLowerCase().includes(q) ||
        bot.conditionType.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      if (sortMode === 'profit') {
        const pa = botLifetimeStats[a.id]?.netProfit ?? 0;
        const pb = botLifetimeStats[b.id]?.netProfit ?? 0;
        return pb - pa;
      }
      if (sortMode === 'winrate') {
        const sa = botLifetimeStats[a.id];
        const sb = botLifetimeStats[b.id];
        const wa = sa && sa.totalTrades > 0 ? sa.wins / sa.totalTrades : 0;
        const wb = sb && sb.totalTrades > 0 ? sb.wins / sb.totalTrades : 0;
        return wb - wa;
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [automations, botLifetimeStats, filterMode, isBotRunning, savedStrategies, searchQuery, sortMode, strategy.id]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = String(ev.target?.result || '');
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (parsed && Array.isArray(parsed.bots)) {
            let count = 0;
            for (const b of parsed.bots) {
              if (b && b.name && b.symbol) {
                createStoredBot({
                  ...DEFAULT_STRATEGY,
                  ...b,
                  id: `vault-${Date.now()}-${count}`,
                });
                count++;
              }
            }
            pushToast({
              type: 'success',
              title: 'Vault Backup Restored',
              message: `Imported ${count} bot(s) into your Bots library.`,
            });
            return;
          }
        } catch {
          // Fallback to XML parser
        }
      }
      importXmlContent(content, file.name, true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportVaultJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'HOPELOGIC',
      bots: savedStrategies,
      automations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hopelogic_bots_vault_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    pushToast({
      type: 'success',
      title: 'Bots Vault Exported',
      message: `Exported ${savedStrategies.length} stored bot(s) to JSON.`,
    });
  };

  const handleLaunchStoredBot = (bot: BotStrategyConfig, forceFast?: boolean) => {
    const rule = getAutomationForBot(bot.id);
    const targetMode: BotExecutionMode = forceFast ? 'fast' : rule.executionMode || executionMode;
    if (targetMode !== executionMode) {
      setExecutionMode(targetMode);
    }
    startBot(bot);
  };

  const handleCreateNewBot = (e: React.FormEvent) => {
    e.preventDefault();
    const symObj = MARKET_SYMBOLS.find(m => m.symbol === newSymbol) || MARKET_SYMBOLS[0];
    const id = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const created: BotStrategyConfig = {
      ...DEFAULT_STRATEGY,
      id,
      name: newName.trim() || 'Custom Automated Bot',
      description: newDesc.trim() || undefined,
      saveType: 'local',
      updatedAt: Date.now(),
      market: symObj.market as MarketCategory,
      symbol: symObj.symbol,
      tradeType: newTradeType,
      contractDirection: newDirection,
      conditionType: newCondition,
      strategySystem: newSystem,
      initialStake: Math.max(0.35, Number(newStake) || 1),
      duration: Math.max(1, Number(newDuration) || 2),
      durationUnit: 't',
      takeProfit: Math.max(0, Number(newTp) || 0),
      stopLoss: Math.max(0, Number(newSl) || 0),
    };
    createStoredBot(created);
    if (newAutoEnable) {
      updateBotAutomation(id, {
        enabled: true,
        executionMode: newExecMode,
        triggerType: 'signal_match',
      });
    }
    setIsCreateOpen(false);
    setConfigBotId(id);
  };

  const formatTriggerLabel = (botId: string) => {
    const rule = automations[botId];
    if (!rule || !rule.enabled) return 'Manual Standby';
    switch (rule.triggerType) {
      case 'scheduled_time':
        return `Daily @ ${rule.scheduledTime}`;
      case 'timer_interval':
        return `Every ${rule.intervalMinutes}m Cycle`;
      case 'signal_match':
        return 'Auto Signal Trigger';
      case 'manual':
      default:
        return rule.chainNextBotId ? 'Chain Ready' : 'Armed (Manual)';
    }
  };

  const formatConditionName = (cond: PurchaseConditionType) => {
    switch (cond) {
      case 'every_tick':
        return 'Every Tick';
      case 'sma_cross':
        return 'SMA Crossover';
      case 'rsi_threshold':
        return 'RSI Threshold';
      case 'bollinger_breakout':
        return 'Bollinger Bands';
      case 'last_digit_streak':
        return 'Digit Streak';
      case 'candle_color':
        return 'Candle Color';
      default:
        return cond;
    }
  };

  const configBot = useMemo(
    () => (configBotId ? savedStrategies.find(b => b.id === configBotId) || null : null),
    [configBotId, savedStrategies]
  );

  const inputCls = isDark
    ? 'bg-[#111418] border-[#2d333b] text-slate-100 focus:border-[#00a79e]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#00a79e]';

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-7 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hidden File Upload Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Header Row: Title + Quick Vault Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00a79e]/15 text-[#00a79e] flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Bots Vault &amp; Automation Hub
                </h1>
                <p className="text-xs opacity-70">
                  Store your custom trading bots, configure hands-free triggers, chain strategies, and run in Normal or Fast mode.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => saveCurrentStrategy(strategy.name, false)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#181b1f] border-[#2d333b] hover:border-[#00a79e] text-slate-100'
                  : 'bg-white border-slate-200 hover:border-[#00a79e] text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00a79e]" />
              <span>Store Builder Bot</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#181b1f] border-[#2d333b] hover:bg-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-[#00a79e]" />
              <span>Import Bot</span>
            </button>

            <button
              type="button"
              onClick={handleExportVaultJson}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-[#181b1f] border-[#2d333b] hover:bg-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup Vault</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Stored Bot</span>
            </button>
          </div>
        </div>

        {/* Autopilot Master Control & Vault Metrics Strip */}
        <div
          className={`rounded-2xl border p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center ${
            isAutopilotArmed
              ? isDark
                ? 'bg-[#12221e] border-[#00a79e]/60'
                : 'bg-teal-50/70 border-[#00a79e]/40'
              : isDark
              ? 'bg-[#181b1f] border-[#262b33]'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="lg:col-span-5 flex items-center justify-between sm:justify-start gap-4">
            <button
              type="button"
              onClick={() => setIsAutopilotArmed(!isAutopilotArmed)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                isAutopilotArmed
                  ? 'bg-[#3bf75a] text-slate-950 shadow-md'
                  : isDark
                  ? 'bg-[#252a32] hover:bg-[#2f3640] text-slate-100 border border-slate-600'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isAutopilotArmed ? 'Autopilot: ARMED' : 'Arm Autopilot'}</span>
            </button>

            <div className="min-w-0">
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isAutopilotArmed ? 'bg-[#3bf75a] animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>
                  {isAutopilotArmed
                    ? 'Automated Scheduler & Bot Chaining Active'
                    : 'Automation Engine on Standby'}
                </span>
              </div>
              <p className="text-[11px] opacity-70 mt-0.5">
                {armedAutomationsCount > 0
                  ? `${armedAutomationsCount} stored bot(s) configured with automation rules.`
                  : 'Click "Automate" on any stored bot below to set schedules, signals, or chains.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121519]/90 border-[#262b33]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
                Stored Bots
              </div>
              <div className="text-base font-bold font-mono mt-0.5">{savedStrategies.length}</div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121519]/90 border-[#262b33]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
                Automated
              </div>
              <div className="text-base font-bold font-mono text-[#00a79e] mt-0.5">
                {armedAutomationsCount}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121519]/90 border-[#262b33]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
                Vault Win Rate
              </div>
              <div className="text-base font-bold font-mono mt-0.5">
                {vaultAggregate.winRate}%{' '}
                <span className="text-[10px] opacity-60 font-normal">
                  ({vaultAggregate.totalTrades})
                </span>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-[#121519]/90 border-[#262b33]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">
                Lifetime P/L
              </div>
              <div
                className={`text-base font-bold font-mono mt-0.5 ${
                  vaultAggregate.netProfit > 0
                    ? 'text-emerald-500'
                    : vaultAggregate.netProfit < 0
                    ? 'text-[#ff444f]'
                    : ''
                }`}
              >
                {vaultAggregate.netProfit > 0 ? '+' : ''}
                {vaultAggregate.netProfit.toFixed(2)} {activeAccount.currency}
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter Pills & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: `All Bots (${savedStrategies.length})` },
                { id: 'automated', label: `Automated (${armedAutomationsCount})` },
                {
                  id: 'favorites',
                  label: `Favorites (${savedStrategies.filter(b => b.isFavorite).length})`,
                },
                { id: 'running', label: 'Running Now' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  filterMode === tab.id
                    ? 'bg-[#00a79e] text-white'
                    : isDark
                    ? 'bg-[#181b1f] text-slate-300 hover:bg-slate-800 border border-[#262b33]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stored bots..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none ${inputCls}`}
              />
            </div>

            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              aria-label="Sort stored bots"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${inputCls}`}
            >
              <option value="recent">Sort: Recent</option>
              <option value="profit">Sort: Highest P/L</option>
              <option value="winrate">Sort: Win Rate</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {/* Stored Bots Grid */}
        {filteredBots.length === 0 ? (
          <div
            className={`rounded-2xl border p-12 text-center space-y-3 ${
              isDark ? 'bg-[#181b1f] border-[#262b33]' : 'bg-white border-slate-200'
            }`}
          >
            <Bot className="w-10 h-10 mx-auto opacity-40" />
            <div className="text-sm font-bold">No matching bots in this view</div>
            <p className="text-xs opacity-65 max-w-md mx-auto">
              Create a new bot, import an existing Deriv `.xml` strategy, or store your active Bot Builder workspace here to start automating.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                Show All Stored Bots
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[#00a79e] text-white text-xs font-bold cursor-pointer"
              >
                Create Bot
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBots.map(bot => {
              const sym =
                MARKET_SYMBOLS.find(m => m.symbol === bot.symbol) || MARKET_SYMBOLS[0];
              const rule = getAutomationForBot(bot.id);
              const stats = botLifetimeStats[bot.id];
              const winRate =
                stats && stats.totalTrades > 0
                  ? Math.round((stats.wins / stats.totalTrades) * 100)
                  : 0;
              const isThisActiveBot = isBotRunning && strategy.id === bot.id;
              const chainedBot = rule.chainNextBotId
                ? savedStrategies.find(b => b.id === rule.chainNextBotId)
                : null;
              const sysLabel =
                QUICK_STRATEGIES.find(q => q.id === bot.strategySystem)?.label || 'Flat Stake';

              return (
                <div
                  key={bot.id}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all ${
                    isThisActiveBot
                      ? isDark
                        ? 'bg-[#162224] border-[#00a79e] ring-1 ring-[#00a79e]/40'
                        : 'bg-teal-50/40 border-[#00a79e] ring-1 ring-[#00a79e]/30'
                      : isDark
                      ? 'bg-[#181b1f] border-[#262b33] hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Top Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm truncate">{bot.name}</h3>
                          {isThisActiveBot && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isBotPaused
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-[#3bf75a] text-slate-950'
                              }`}
                            >
                              {isBotPaused ? 'Paused' : 'Running'}
                            </span>
                          )}
                          {rule.enabled && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00a79e]/15 text-[#00a79e] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Automated
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] opacity-70 mt-0.5 truncate">
                          {sym.displayName} ({sym.shortCode}) • {bot.contractDirection}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleSavedBotFavorite(bot.id)}
                          title={bot.isFavorite ? 'Remove from favorites' : 'Pin to favorites'}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            bot.isFavorite
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${bot.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => loadStrategyIntoBuilder(bot, true)}
                          title="Edit blocks in Bot Builder"
                          className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => duplicateSavedStrategy(bot.id)}
                          title="Duplicate stored bot"
                          className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadXmlForStrategy(bot)}
                          title="Export Deriv .xml"
                          className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteSavedStrategy(bot.id)}
                          title="Delete stored bot"
                          className="p-1.5 rounded-lg text-[#ff444f] opacity-75 hover:opacity-100 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Strategy Spec Tags */}
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div
                        className={`p-2 rounded-lg border ${
                          isDark ? 'bg-[#121519] border-[#252a32]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] opacity-60">Entry / System</div>
                        <div className="font-semibold truncate mt-0.5">
                          {formatConditionName(bot.conditionType)}
                        </div>
                        <div className="text-[10px] text-[#00a79e] font-medium truncate">
                          {sysLabel}
                        </div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          isDark ? 'bg-[#121519] border-[#252a32]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] opacity-60">Stake / Guards</div>
                        <div className="font-mono font-bold mt-0.5">
                          {bot.initialStake.toFixed(2)} {activeAccount.currency}
                        </div>
                        <div className="text-[10px] font-mono opacity-75 truncate">
                          TP {bot.takeProfit || '—'} / SL {bot.stopLoss || '—'}
                        </div>
                      </div>

                      <div
                        className={`p-2 rounded-lg border ${
                          isDark ? 'bg-[#121519] border-[#252a32]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="text-[10px] opacity-60">Lifetime P/L</div>
                        <div
                          className={`font-mono font-bold mt-0.5 ${
                            (stats?.netProfit ?? 0) > 0
                              ? 'text-emerald-500'
                              : (stats?.netProfit ?? 0) < 0
                              ? 'text-[#ff444f]'
                              : ''
                          }`}
                        >
                          {(stats?.netProfit ?? 0) > 0 ? '+' : ''}
                          {(stats?.netProfit ?? 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
                          {stats ? `${winRate}% (${stats.totalTrades} runs)` : '0 runs yet'}
                        </div>
                      </div>
                    </div>

                    {/* Automation Status Strip */}
                    <div
                      className={`px-3 py-2 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                        rule.enabled
                          ? isDark
                            ? 'bg-[#112220] border-[#00a79e]/40 text-teal-200'
                            : 'bg-teal-50 border-teal-200 text-teal-900'
                          : isDark
                          ? 'bg-[#13161a] border-[#242931] text-slate-400'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#00a79e]" />
                        <span className="font-semibold truncate">{formatTriggerLabel(bot.id)}</span>
                        <span className="opacity-60">•</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold">
                          {rule.executionMode === 'fast' ? (
                            <>
                              <Zap className="w-3 h-3 text-[#3bf75a] fill-current" />
                              Fast
                            </>
                          ) : (
                            <>
                              <Gauge className="w-3 h-3" />
                              Normal
                            </>
                          )}
                        </span>
                        {chainedBot && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] opacity-85 truncate">
                            <Link2 className="w-3 h-3" />
                            {chainedBot.name}
                          </span>
                        )}
                      </div>

                      <label className="inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={e =>
                            updateBotAutomation(bot.id, { enabled: e.target.checked })
                          }
                          className="accent-[#00a79e] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold uppercase">
                          {rule.enabled ? 'On' : 'Off'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Card Footer Action Bar */}
                  <div className="pt-2 border-t border-slate-200/70 dark:border-[#262b33] flex items-center justify-between gap-2">
                    {isThisActiveBot ? (
                      <div className="flex items-center gap-1.5">
                        {!isBotPaused ? (
                          <button
                            type="button"
                            onClick={pauseBot}
                            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={resumeBot}
                            className="px-3 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Resume</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => stopBot()}
                          className="px-3 py-2 rounded-lg bg-[#ff444f] hover:bg-[#e03842] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLaunchStoredBot(bot, false)}
                          className="px-3.5 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLaunchStoredBot(bot, true)}
                          title="Launch immediately in Turbo Fast Mode"
                          className={`px-3 py-2 rounded-lg border text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                            isDark
                              ? 'bg-[#13261b] border-[#3bf75a]/40 text-[#3bf75a] hover:bg-[#193524]'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Fast Run</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setConfigBotId(bot.id)}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isDark
                          ? 'border-slate-600 hover:border-[#00a79e] text-slate-200'
                          : 'border-slate-300 hover:border-[#00a79e] text-slate-800'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#00a79e]" />
                      <span>Automate</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOT AUTOMATION CONFIGURATION MODAL */}
      {configBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          {(() => {
            const rule = getAutomationForBot(configBot.id);
            const stats = botLifetimeStats[configBot.id];
            return (
              <div
                className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
                  isDark
                    ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">Automate &amp; Configure Bot</h3>
                    <p className="text-[11px] opacity-70">{configBot.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfigBotId(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-200/40 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                  {/* Enable Rule Toggle */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      rule.enabled
                        ? isDark
                          ? 'bg-[#112220] border-[#00a79e]/50'
                          : 'bg-teal-50 border-teal-200'
                        : isDark
                        ? 'bg-[#121519] border-[#262b33]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold">Enable Automation Rule</div>
                      <div className="text-[11px] opacity-75">
                        Allows Autopilot to auto-launch, cap runs, and chain this bot.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={e =>
                        updateBotAutomation(configBot.id, { enabled: e.target.checked })
                      }
                      className="accent-[#00a79e] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {/* Execution Mode */}
                  <div className="space-y-1.5">
                    <label className="font-bold block">Bot Execution Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateBotAutomation(configBot.id, { executionMode: 'normal' })
                        }
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          rule.executionMode === 'normal'
                            ? 'bg-[#00a79e] border-[#00a79e] text-white'
                            : isDark
                            ? 'bg-[#121519] border-[#2d333b]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Gauge className="w-4 h-4" />
                        <span>Normal Mode</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateBotAutomation(configBot.id, { executionMode: 'fast' })
                        }
                        className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                          rule.executionMode === 'fast'
                            ? 'bg-[#3bf75a] border-[#3bf75a] text-slate-950'
                            : isDark
                            ? 'bg-[#121519] border-[#2d333b]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>Fast Mode (Turbo)</span>
                      </button>
                    </div>
                  </div>

                  {/* Trigger Type */}
                  <div className="space-y-1.5">
                    <label className="font-bold block">Auto-Start Trigger</label>
                    <select
                      value={rule.triggerType}
                      onChange={e =>
                        updateBotAutomation(configBot.id, {
                          triggerType: e.target.value as AutomationTriggerType,
                        })
                      }
                      className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                    >
                      <option value="signal_match">
                        Live Market Signal Match ({formatConditionName(configBot.conditionType)})
                      </option>
                      <option value="timer_interval">Recurring Interval Timer (Every N mins)</option>
                      <option value="scheduled_time">Daily Scheduled Clock Time (HH:MM)</option>
                      <option value="manual">Manual Launch / Chain Target Only</option>
                    </select>
                  </div>

                  {rule.triggerType === 'scheduled_time' && (
                    <div className="space-y-1">
                      <label className="font-semibold block">Scheduled Local Time (24h)</label>
                      <input
                        type="time"
                        value={rule.scheduledTime}
                        onChange={e =>
                          updateBotAutomation(configBot.id, { scheduledTime: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border font-mono ${inputCls}`}
                      />
                    </div>
                  )}

                  {rule.triggerType === 'timer_interval' && (
                    <div className="space-y-1">
                      <label className="font-semibold block">Repeat Cycle Interval (minutes)</label>
                      <input
                        type="number"
                        min={1}
                        max={240}
                        value={rule.intervalMinutes}
                        onChange={e =>
                          updateBotAutomation(configBot.id, {
                            intervalMinutes: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className={`w-full px-3 py-2 rounded-lg border font-mono ${inputCls}`}
                      />
                    </div>
                  )}

                  {/* Session Limits & Bot Chaining */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold block">
                        Max Runs per Session (0 = Unlimited)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={rule.maxRunsPerSession}
                        onChange={e =>
                          updateBotAutomation(configBot.id, {
                            maxRunsPerSession: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className={`w-full px-3 py-2 rounded-lg border font-mono ${inputCls}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold block">Chain Next Bot on TP / Max Runs</label>
                      <select
                        value={rule.chainNextBotId}
                        onChange={e =>
                          updateBotAutomation(configBot.id, { chainNextBotId: e.target.value })
                        }
                        className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                      >
                        <option value="">None (Stop after session)</option>
                        {savedStrategies
                          .filter(b => b.id !== configBot.id)
                          .map(other => (
                            <option key={other.id} value={other.id}>
                              → {other.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Risk & Stake Tuning */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="font-bold">Stored Stake &amp; Session Guards</div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] opacity-70 block mb-1">
                          Initial Stake ({activeAccount.currency})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.35"
                          value={configBot.initialStake}
                          onChange={e =>
                            updateSavedBot(configBot.id, {
                              initialStake: Math.max(0.35, Number(e.target.value) || 0.35),
                            })
                          }
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] opacity-70 block mb-1">
                          Take Profit ({activeAccount.currency})
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={configBot.takeProfit}
                          onChange={e =>
                            updateSavedBot(configBot.id, {
                              takeProfit: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] opacity-70 block mb-1">
                          Stop Loss ({activeAccount.currency})
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={configBot.stopLoss}
                          onChange={e =>
                            updateSavedBot(configBot.id, {
                              stopLoss: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                          className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.autoResetBeforeStart}
                      onChange={e =>
                        updateBotAutomation(configBot.id, {
                          autoResetBeforeStart: e.target.checked,
                        })
                      }
                      className="accent-[#00a79e] w-3.5 h-3.5"
                    />
                    <span className="opacity-85">
                      Clear previous Run Panel transactions before automated launch
                    </span>
                  </label>

                  {stats && stats.totalTrades > 0 && (
                    <div className="pt-2 flex items-center justify-between text-[11px] opacity-75">
                      <span>
                        Lifetime Vault Record: {stats.wins}W / {stats.losses}L ({stats.netProfit >= 0 ? '+' : ''}
                        {stats.netProfit.toFixed(2)} {activeAccount.currency})
                      </span>
                      <button
                        type="button"
                        onClick={() => resetBotLifetimeStats(configBot.id)}
                        className="inline-flex items-center gap-1 text-[#ff444f] hover:underline cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset record
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  {!isAutopilotArmed && rule.enabled ? (
                    <button
                      type="button"
                      onClick={() => setIsAutopilotArmed(true)}
                      className="px-3.5 py-2 rounded-lg bg-[#3bf75a] text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Arm Autopilot Now</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleLaunchStoredBot(configBot);
                        setConfigBotId(null);
                      }}
                      className="px-3.5 py-2 rounded-lg border border-[#00a79e] text-[#00a79e] hover:bg-[#00a79e]/10 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfigBotId(null)}
                      className="px-4 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* CREATE NEW STORED BOT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateNewBot}
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">Create &amp; Store New Bot</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200/40 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Bot Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Market Symbol</label>
                  <select
                    value={newSymbol}
                    onChange={e => setNewSymbol(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                  >
                    {MARKET_SYMBOLS.map(s => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.displayName} ({s.shortCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Notes / Strategy Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Trade Type</label>
                  <select
                    value={newTradeType}
                    onChange={e => {
                      const nextT = e.target.value as TradeTypeGroup;
                      setNewTradeType(nextT);
                      const grp =
                        TRADE_TYPE_OPTIONS.find(g => g.value === nextT) || TRADE_TYPE_OPTIONS[0];
                      setNewDirection(grp.directions[0].value);
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                  >
                    {TRADE_TYPE_OPTIONS.map(g => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Contract Direction</label>
                  <select
                    value={newDirection}
                    onChange={e => setNewDirection(e.target.value as ContractDirection)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                  >
                    {(
                      TRADE_TYPE_OPTIONS.find(g => g.value === newTradeType) ||
                      TRADE_TYPE_OPTIONS[0]
                    ).directions.map(d => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Entry Signal Condition</label>
                  <select
                    value={newCondition}
                    onChange={e => setNewCondition(e.target.value as PurchaseConditionType)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                  >
                    <option value="every_tick">Unconditional Every Tick</option>
                    <option value="sma_cross">SMA Crossover</option>
                    <option value="rsi_threshold">RSI Threshold</option>
                    <option value="bollinger_breakout">Bollinger Bands</option>
                    <option value="last_digit_streak">Last Digit Streak</option>
                    <option value="candle_color">Candle Bullish / Bearish</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Money Management System</label>
                  <select
                    value={newSystem}
                    onChange={e => setNewSystem(e.target.value as StrategySystemType)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputCls}`}
                  >
                    <option value="CUSTOM_FLAT">Flat Stake (Fixed)</option>
                    {QUICK_STRATEGIES.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] opacity-70 block mb-1">Stake</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.35"
                    value={newStake}
                    onChange={e => setNewStake(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-70 block mb-1">Ticks</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-70 block mb-1">Take Profit</label>
                  <input
                    type="number"
                    min="0"
                    value={newTp}
                    onChange={e => setNewTp(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] opacity-70 block mb-1">Stop Loss</label>
                  <input
                    type="number"
                    min="0"
                    value={newSl}
                    onChange={e => setNewSl(Number(e.target.value))}
                    className={`w-full px-2.5 py-1.5 rounded-lg border font-mono ${inputCls}`}
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAutoEnable}
                    onChange={e => setNewAutoEnable(e.target.checked)}
                    className="accent-[#00a79e] w-3.5 h-3.5"
                  />
                  <span className="font-semibold">Pre-enable Automation Rule</span>
                </label>

                <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5">
                  <button
                    type="button"
                    onClick={() => setNewExecMode('normal')}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      newExecMode === 'normal' ? 'bg-[#00a79e] text-white' : 'opacity-70'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExecMode('fast')}
                    className={`px-2 py-1 rounded text-[10px] font-bold ${
                      newExecMode === 'fast' ? 'bg-[#3bf75a] text-slate-950' : 'opacity-70'
                    }`}
                  >
                    Fast
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold cursor-pointer"
              >
                Save &amp; Configure Automation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
