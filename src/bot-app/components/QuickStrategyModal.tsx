import React, { useEffect, useState } from 'react';
import { X, Play, Edit3, Zap } from 'lucide-react';
import { useBot } from '../context/BotContext';
import {
  DEFAULT_STRATEGY,
  MARKET_SYMBOLS,
  QUICK_STRATEGIES,
  TRADE_TYPE_OPTIONS,
} from '../constants/markets-and-strategies';
import {
  BotStrategyConfig,
  BotTab,
  ContractDirection,
  QuickStrategyId,
  TradeTypeGroup,
} from '../types/bot.types';

export const QuickStrategyModal: React.FC = () => {
  const {
    isDark,
    isQuickStrategyOpen,
    closeQuickStrategy,
    preselectedQuickStrategy,
    strategy,
    replaceStrategy,
    setActiveTab,
    startBot,
    activeAccount,
  } = useBot();

  const [selectedId, setSelectedId] = useState<QuickStrategyId>('MARTINGALE');
  const [innerTab, setInnerTab] = useState<'params' | 'learn'>('params');

  const [symbol, setSymbol] = useState(strategy.symbol);
  const [tradeType, setTradeType] = useState<TradeTypeGroup>(strategy.tradeType);
  const [contractDirection, setContractDirection] = useState<ContractDirection>(
    strategy.contractDirection
  );
  const [durationUnit, setDurationUnit] = useState<'t' | 's' | 'm'>(strategy.durationUnit);
  const [duration, setDuration] = useState<number>(strategy.duration);
  const [initialStake, setInitialStake] = useState<number>(strategy.initialStake);
  const [sizeMultiplier, setSizeMultiplier] = useState<number>(strategy.sizeMultiplier);
  const [unitAmount, setUnitAmount] = useState<number>(strategy.unitAmount);
  const [takeProfit, setTakeProfit] = useState<number>(strategy.takeProfit);
  const [stopLoss, setStopLoss] = useState<number>(strategy.stopLoss);
  const [maxStakeEnabled, setMaxStakeEnabled] = useState<boolean>(strategy.maxStakeEnabled);
  const [maxStake, setMaxStake] = useState<number>(strategy.maxStake);

  useEffect(() => {
    if (!isQuickStrategyOpen) return;
    if (
      preselectedQuickStrategy &&
      QUICK_STRATEGIES.some(q => q.id === preselectedQuickStrategy)
    ) {
      setSelectedId(preselectedQuickStrategy as QuickStrategyId);
    }
    setSymbol(strategy.symbol);
    setTradeType(strategy.tradeType);
    setContractDirection(strategy.contractDirection);
    setDurationUnit(strategy.durationUnit);
    setDuration(strategy.duration);
    setInitialStake(strategy.initialStake);
    setTakeProfit(strategy.takeProfit || 25);
    setStopLoss(strategy.stopLoss || 50);
  }, [isQuickStrategyOpen, preselectedQuickStrategy, strategy]);

  if (!isQuickStrategyOpen) return null;

  const activeMeta =
    QUICK_STRATEGIES.find(q => q.id === selectedId) || QUICK_STRATEGIES[0];
  const tradeGroup =
    TRADE_TYPE_OPTIONS.find(g => g.value === tradeType) || TRADE_TYPE_OPTIONS[0];
  const symMeta = MARKET_SYMBOLS.find(m => m.symbol === symbol) || MARKET_SYMBOLS[0];

  const buildGeneratedStrategy = (): BotStrategyConfig => ({
    ...DEFAULT_STRATEGY,
    ...strategy,
    id: `qs-${selectedId.toLowerCase()}-${Date.now()}`,
    name: `${activeMeta.label} — ${symMeta.shortCode}`,
    saveType: 'quick_strategy',
    updatedAt: Date.now(),
    market: symMeta.market,
    symbol: symMeta.symbol,
    tradeType,
    contractDirection,
    durationUnit,
    duration: Math.max(1, duration),
    initialStake: Math.max(0.35, initialStake),
    strategySystem: selectedId,
    sizeMultiplier: Math.max(1.1, sizeMultiplier),
    unitAmount: Math.max(0.5, unitAmount),
    takeProfit: Math.max(1, takeProfit),
    stopLoss: Math.max(1, stopLoss),
    maxStakeEnabled,
    maxStake: Math.max(initialStake, maxStake),
  });

  const handleEditInWorkspace = () => {
    const built = buildGeneratedStrategy();
    replaceStrategy(built);
    setActiveTab(BotTab.BOT_BUILDER);
    closeQuickStrategy();
  };

  const handleRunImmediately = () => {
    const built = buildGeneratedStrategy();
    replaceStrategy(built);
    setActiveTab(BotTab.BOT_BUILDER);
    closeQuickStrategy();
    startBot(built);
  };

  const inputCls = isDark
    ? 'bg-[#111417] border-[#2d333b] text-slate-100 focus:border-[#00a79e]'
    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#00a79e]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs">
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark
            ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#262b33] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00a79e]" />
            <h2 className="font-bold text-base">Quick Strategy</h2>
          </div>
          <button
            type="button"
            onClick={closeQuickStrategy}
            className="p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Left Strategy Selector + Right Configuration/Description */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Strategy List */}
          <div
            className={`md:w-60 border-b md:border-b-0 md:border-r p-2.5 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 ${
              isDark ? 'border-[#262b33] bg-[#14171a]' : 'border-slate-200 bg-slate-50/70'
            }`}
          >
            {QUICK_STRATEGIES.map(qs => {
              const active = qs.id === selectedId;
              return (
                <button
                  key={qs.id}
                  type="button"
                  onClick={() => setSelectedId(qs.id)}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs font-semibold whitespace-nowrap md:whitespace-normal transition-colors ${
                    active
                      ? 'bg-[#00a79e] text-white shadow-xs'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <div>{qs.label}</div>
                  <div
                    className={`hidden md:block text-[10px] font-normal mt-0.5 ${
                      active ? 'text-white/85' : 'opacity-60'
                    }`}
                  >
                    {qs.riskLevel} Risk
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Inner Tabs: Trade parameters | Learn more */}
            <div
              className={`px-5 border-b flex gap-6 text-xs font-semibold shrink-0 ${
                isDark ? 'border-[#262b33]' : 'border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setInnerTab('params')}
                className={`py-3 border-b-2 transition-colors ${
                  innerTab === 'params'
                    ? 'border-[#ff444f] text-[#ff444f] font-bold'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                Trade parameters
              </button>
              <button
                type="button"
                onClick={() => setInnerTab('learn')}
                className={`py-3 border-b-2 transition-colors ${
                  innerTab === 'learn'
                    ? 'border-[#ff444f] text-[#ff444f] font-bold'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                Learn more
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {innerTab === 'params' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1.5">Asset</label>
                    <select
                      value={symbol}
                      onChange={e => setSymbol(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none ${inputCls}`}
                    >
                      {MARKET_SYMBOLS.map(s => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.marketLabel} — {s.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5">Trade type</label>
                    <select
                      value={tradeType}
                      onChange={e => {
                        const g = e.target.value as TradeTypeGroup;
                        setTradeType(g);
                        const meta =
                          TRADE_TYPE_OPTIONS.find(x => x.value === g) || TRADE_TYPE_OPTIONS[0];
                        setContractDirection(meta.directions[0].value);
                      }}
                      className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none ${inputCls}`}
                    >
                      {TRADE_TYPE_OPTIONS.map(g => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5">Purchase condition</label>
                    <select
                      value={contractDirection}
                      onChange={e => setContractDirection(e.target.value as ContractDirection)}
                      className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none ${inputCls}`}
                    >
                      {tradeGroup.directions.map(d => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5">Duration unit</label>
                    <select
                      value={durationUnit}
                      onChange={e => setDurationUnit(e.target.value as 't' | 's' | 'm')}
                      className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none ${inputCls}`}
                    >
                      <option value="t">Ticks</option>
                      <option value="s">Seconds</option>
                      <option value="m">Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5">Duration value</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={duration}
                      onChange={e => setDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className={`w-full px-3 py-2 rounded-lg border font-mono focus:outline-none ${inputCls}`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5">
                      Initial stake ({activeAccount.currency})
                    </label>
                    <input
                      type="number"
                      min={0.35}
                      step="0.5"
                      value={initialStake}
                      onChange={e =>
                        setInitialStake(Math.max(0.35, parseFloat(e.target.value) || 1))
                      }
                      className={`w-full px-3 py-2 rounded-lg border font-mono font-bold focus:outline-none ${inputCls}`}
                    />
                  </div>

                  {(selectedId === 'MARTINGALE' || selectedId === 'REVERSE_MARTINGALE') && (
                    <div>
                      <label className="block font-semibold mb-1.5">Size (Multiplier)</label>
                      <input
                        type="number"
                        min={1.1}
                        step="0.1"
                        value={sizeMultiplier}
                        onChange={e =>
                          setSizeMultiplier(Math.max(1.1, parseFloat(e.target.value) || 2))
                        }
                        className={`w-full px-3 py-2 rounded-lg border font-mono focus:outline-none ${inputCls}`}
                      />
                    </div>
                  )}

                  {(selectedId === 'D_ALEMBERT' || selectedId === 'REVERSE_D_ALEMBERT') && (
                    <div>
                      <label className="block font-semibold mb-1.5">Unit increment</label>
                      <input
                        type="number"
                        min={0.5}
                        step="0.5"
                        value={unitAmount}
                        onChange={e =>
                          setUnitAmount(Math.max(0.5, parseFloat(e.target.value) || 1))
                        }
                        className={`w-full px-3 py-2 rounded-lg border font-mono focus:outline-none ${inputCls}`}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold mb-1.5">
                      Profit threshold ({activeAccount.currency})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={takeProfit}
                      onChange={e =>
                        setTakeProfit(Math.max(1, parseFloat(e.target.value) || 25))
                      }
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-emerald-500 font-bold focus:outline-none ${inputCls}`}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1.5">
                      Loss threshold ({activeAccount.currency})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={stopLoss}
                      onChange={e =>
                        setStopLoss(Math.max(1, parseFloat(e.target.value) || 50))
                      }
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-[#ff444f] font-bold focus:outline-none ${inputCls}`}
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={maxStakeEnabled}
                        onChange={e => setMaxStakeEnabled(e.target.checked)}
                        className="w-4 h-4 accent-[#00a79e]"
                      />
                      <span>Enable Maximum Stake Cap</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      disabled={!maxStakeEnabled}
                      value={maxStake}
                      onChange={e =>
                        setMaxStake(Math.max(1, parseFloat(e.target.value) || 64))
                      }
                      className={`w-28 px-3 py-1.5 rounded-lg border font-mono text-right disabled:opacity-40 ${inputCls}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base">{activeMeta.label}</h3>
                    {activeMeta.description.map((line, idx) => (
                      <p key={idx} className="opacity-80 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div
                    className={`p-3 rounded-xl border font-mono text-[11px] ${
                      isDark
                        ? 'bg-[#111417] border-[#262b33] text-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-teal-800'
                    }`}
                  >
                    {activeMeta.formulaSummary}
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-4 flex justify-center">
                    <img
                      src={activeMeta.diagramUrl}
                      alt={activeMeta.label}
                      className="max-h-52 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions: Edit | Run */}
            <div
              className={`px-5 py-3.5 border-t flex items-center justify-end gap-2.5 shrink-0 ${
                isDark ? 'border-[#262b33] bg-[#14171a]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={handleEditInWorkspace}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${
                  isDark
                    ? 'border-slate-600 hover:bg-slate-800 text-slate-100'
                    : 'border-slate-300 hover:bg-white text-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleRunImmediately}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
