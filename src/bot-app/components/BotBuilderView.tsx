import React, { useState } from 'react';
import {
  FolderOpen,
  Save,
  Download,
  Undo2,
  Redo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Zap,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  Plus,
  Trash2,
  HelpCircle,
  X,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import {
  MARKET_SYMBOLS,
  QUICK_STRATEGIES,
  strategyToDerivXml,
  TRADE_TYPE_OPTIONS,
} from '../constants/markets-and-strategies';
import {
  ContractDirection,
  MarketCategory,
  PurchaseConditionType,
  StrategySystemType,
  TradeTypeGroup,
} from '../types/bot.types';

interface ToolboxItem {
  id: string;
  category: string;
  label: string;
  badge: string;
  helpImg?: string;
  description: string;
  apply: () => void;
}

export const BotBuilderView: React.FC = () => {
  const {
    isDark,
    strategy,
    updateStrategy,
    undoStrategy,
    redoStrategy,
    canUndo,
    canRedo,
    resetWorkspace,
    setIsLoadModalOpen,
    setIsSaveModalOpen,
    downloadXmlForStrategy,
    openQuickStrategy,
    activeAccount,
    activeExecutingBlock,
    isBotRunning,
    currentStake,
  } = useBot();

  const [isToolboxOpen, setIsToolboxOpen] = useState(true);
  const [toolboxSearch, setToolboxSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [zoomPct, setZoomPct] = useState<number>(100);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [helpItem, setHelpItem] = useState<ToolboxItem | null>(null);
  const [newVarName, setNewVarName] = useState('');

  const currentTradeGroup =
    TRADE_TYPE_OPTIONS.find(g => g.value === strategy.tradeType) || TRADE_TYPE_OPTIONS[0];

  const toolboxItems: ToolboxItem[] = [
    {
      id: 'cond-every-tick',
      category: 'Purchase',
      label: 'Unconditional Every Tick',
      badge: 'Block 2',
      description: 'Executes your selected contract direction immediately on the next incoming market tick.',
      helpImg: '/assets/images/loss_control_purchase_conditions.png',
      apply: () => updateStrategy({ conditionType: 'every_tick' }),
    },
    {
      id: 'cond-sma',
      category: 'Indicators',
      label: 'Simple Moving Average (SMA Crossover)',
      badge: 'Indicator',
      description: 'Compares Fast SMA against Slow SMA over live tick history before triggering purchase.',
      helpImg: '/assets/media/sma_formula.png',
      apply: () => updateStrategy({ conditionType: 'sma_cross', fastPeriod: 5, slowPeriod: 14 }),
    },
    {
      id: 'cond-rsi',
      category: 'Indicators',
      label: 'Relative Strength Index (RSI)',
      badge: 'Indicator',
      description: 'Triggers Rise when RSI dips into oversold territory (or Fall when overbought).',
      helpImg: '/assets/media/sma_chart_1.png',
      apply: () => updateStrategy({ conditionType: 'rsi_threshold', rsiPeriod: 14, rsiThreshold: 35 }),
    },
    {
      id: 'cond-bb',
      category: 'Indicators',
      label: 'Bollinger Bands Mean Reversion',
      badge: 'Indicator',
      description: 'Monitors upper and lower 2σ standard deviation bands for breakout or mean-reversion entries.',
      helpImg: '/assets/media/sma_chart_2.png',
      apply: () => updateStrategy({ conditionType: 'bollinger_breakout' }),
    },
    {
      id: 'cond-digit-streak',
      category: 'Digits',
      label: 'Last Digit Streak Detector',
      badge: 'Tick Analysis',
      description: 'Waits for N consecutive Even, Odd, Over-5, or Under-5 last digits before entering.',
      helpImg: '/assets/media/logic.png',
      apply: () =>
        updateStrategy({
          conditionType: 'last_digit_streak',
          digitStreakCount: 2,
          digitStreakTarget: 'odd',
        }),
    },
    {
      id: 'cond-candle',
      category: 'Indicators',
      label: 'Candle Bullish / Bearish Filter',
      badge: 'Candle',
      description: 'Checks whether the active OHLC candle body is bullish (green) or bearish (red/black).',
      helpImg: '/assets/media/is_candle_black.jpeg',
      apply: () => updateStrategy({ conditionType: 'candle_color' }),
    },
    {
      id: 'sell-early',
      category: 'Sell',
      label: 'Sell at Market (Early Profit Lock)',
      badge: 'Block 3',
      description: 'Automatically sells open multi-tick or Accumulator contracts once unrealized profit hits target %.',
      apply: () => updateStrategy({ enableSellConditions: true, sellTakeProfitPct: 45 }),
    },
    {
      id: 'sys-martingale',
      category: 'Restart',
      label: 'Martingale Stake Multiplier',
      badge: 'Block 4',
      description: 'Multiplies stake by Size after a loss and resets to Initial Stake on any win.',
      helpImg: '/assets/images/loss_control_restart_trade_conditions.png',
      apply: () => updateStrategy({ strategySystem: 'MARTINGALE', sizeMultiplier: 2 }),
    },
    {
      id: 'sys-dalembert',
      category: 'Restart',
      label: "D'Alembert Unit Progression",
      badge: 'Block 4',
      description: 'Adds 1 unit after a loss and subtracts 1 unit after a win.',
      apply: () => updateStrategy({ strategySystem: 'D_ALEMBERT', unitAmount: 1 }),
    },
    {
      id: 'sys-1326',
      category: 'Restart',
      label: '1-3-2-6 Positive Sequence',
      badge: 'Block 4',
      description: 'Steps through 1x, 3x, 2x, 6x stake multipliers on consecutive wins.',
      apply: () => updateStrategy({ strategySystem: 'STRATEGY_1_3_2_6' }),
    },
  ];

  const categories = ['all', 'Purchase', 'Indicators', 'Digits', 'Sell', 'Restart'];

  const filteredToolbox = toolboxItems.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = toolboxSearch.trim().toLowerCase();
    const matchesQ =
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const handleSymbolChange = (symCode: string) => {
    const found = MARKET_SYMBOLS.find(m => m.symbol === symCode);
    if (found) {
      updateStrategy({
        symbol: found.symbol,
        market: found.market as MarketCategory,
      });
    }
  };

  const handleTradeTypeChange = (nextGroup: TradeTypeGroup) => {
    const groupMeta = TRADE_TYPE_OPTIONS.find(g => g.value === nextGroup) || TRADE_TYPE_OPTIONS[0];
    updateStrategy({
      tradeType: nextGroup,
      contractDirection: groupMeta.directions[0].value,
    });
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newVarName.trim();
    if (!name) return;
    if (strategy.variables.some(v => v.name.toLowerCase() === name.toLowerCase())) {
      setNewVarName('');
      return;
    }
    updateStrategy({
      variables: [
        ...strategy.variables,
        { id: `var-${Date.now()}`, name, value: 1 },
      ],
    });
    setNewVarName('');
  };

  const inlineFieldCls = isDark
    ? 'bg-[#131722] border-[#39415c] text-white focus:border-[#3bf75a]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#00a79e]';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Bot Builder Workspace Toolbar */}
      <div
        className={`h-12 border-b px-3 flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#181b1f] border-[#262b33]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setIsToolboxOpen(prev => !prev)}
            title={isToolboxOpen ? 'Collapse Blocks Menu' : 'Expand Blocks Menu'}
            className={`p-1.5 rounded-md border text-xs transition-colors ${
              isDark
                ? 'border-[#2d333b] hover:bg-slate-800 text-slate-300'
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {isToolboxOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          {/* Editable Strategy Name */}
          <input
            type="text"
            value={strategy.name}
            onChange={e => updateStrategy({ name: e.target.value }, false)}
            aria-label="Strategy Name"
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#00a79e] ${
              isDark
                ? 'bg-[#111417] border-[#2d333b] text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={() => setIsLoadModalOpen(true)}
            title="Import / Load Strategy (.xml)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#00a79e]" />
            <span className="hidden md:inline">Import</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            title="Save Strategy"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Save className="w-3.5 h-3.5 text-[#00a79e]" />
            <span className="hidden md:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={() => downloadXmlForStrategy(strategy)}
            title="Export Deriv Bot XML"
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

          <button
            type="button"
            disabled={!canUndo}
            onClick={undoStrategy}
            title="Undo"
            className="p-1.5 rounded-md disabled:opacity-35 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!canRedo}
            onClick={redoStrategy}
            title="Redo"
            className="p-1.5 rounded-md disabled:opacity-35 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={resetWorkspace}
            title="Reset Workspace Blocks"
            className="p-1.5 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Toolbar Controls: XML View, Zoom, Quick Strategy */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowXmlPreview(prev => !prev)}
            title="Inspect generated Deriv Bot Blockly XML"
            className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              showXmlPreview
                ? 'bg-[#00a79e] border-[#00a79e] text-white'
                : isDark
                ? 'border-[#2d333b] hover:bg-slate-800'
                : 'border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>XML</span>
          </button>

          <div
            className={`hidden lg:flex items-center rounded-md border px-1 ${
              isDark ? 'border-[#2d333b] bg-[#111417]' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <button
              type="button"
              onClick={() => setZoomPct(z => Math.max(80, z - 10))}
              className="p-1 opacity-75 hover:opacity-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomPct(100)}
              className="px-1.5 text-[11px] font-mono font-semibold"
              title="Reset Zoom"
            >
              {zoomPct}%
            </button>
            <button
              type="button"
              onClick={() => setZoomPct(z => Math.min(115, z + 10))}
              className="p-1 opacity-75 hover:opacity-100"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => openQuickStrategy()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Strategy</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Left Blocks Toolbox + Center Blockly Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Blocks Menu Flyout */}
        {isToolboxOpen && (
          <aside
            className={`w-68 sm:w-72 border-r flex flex-col shrink-0 z-10 ${
              isDark ? 'bg-[#15181c] border-[#262b33]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="p-3 border-b border-slate-200 dark:border-[#262b33] space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={toolboxSearch}
                  onChange={e => setToolboxSearch(e.target.value)}
                  placeholder="Search blocks (RSI, SMA, Digit...)"
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#00a79e] ${
                    isDark
                      ? 'bg-[#0e1013] border-[#2d333b] text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize transition-colors ${
                      selectedCategory === cat
                        ? 'bg-[#00a79e] text-white'
                        : isDark
                        ? 'bg-[#1f242b] text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Blocks Palette List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredToolbox.map(item => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-[#1b2026] border-[#2c333d] hover:border-[#00a79e]'
                      : 'bg-slate-50/80 border-slate-200 hover:border-[#00a79e]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xs font-bold leading-snug">{item.label}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#2a3052] text-white shrink-0">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-70 mt-1 leading-relaxed">{item.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setHelpItem(item)}
                      className="inline-flex items-center gap-1 text-[11px] opacity-70 hover:opacity-100"
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Learn more</span>
                    </button>
                    <button
                      type="button"
                      onClick={item.apply}
                      className="text-[11px] font-bold text-[#00a79e] hover:underline"
                    >
                      Apply Block →
                    </button>
                  </div>
                </div>
              ))}

              {/* Custom Variables Section */}
              <div
                className={`mt-3 pt-3 border-t ${
                  isDark ? 'border-[#262b33]' : 'border-slate-200'
                }`}
              >
                <div className="text-xs font-bold mb-2">Workspace Variables</div>
                <form onSubmit={handleAddVariable} className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={e => setNewVarName(e.target.value)}
                    placeholder="New variable..."
                    className={`flex-1 px-2 py-1 rounded border text-xs ${
                      isDark
                        ? 'bg-[#0e1013] border-[#2d333b] text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded bg-[#2a3052] hover:bg-[#373f6b] text-white text-xs font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="space-y-1.5">
                  {strategy.variables.map(v => (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between gap-2 px-2 py-1 rounded border text-xs ${
                        isDark
                          ? 'bg-[#121519] border-[#282e37]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="truncate font-medium">{v.name}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={v.value}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            updateStrategy({
                              variables: strategy.variables.map(item =>
                                item.id === v.id ? { ...item, value: val } : item
                              ),
                            });
                          }}
                          className={`w-14 px-1.5 py-0.5 rounded border text-right font-mono text-[11px] ${inlineFieldCls}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateStrategy({
                              variables: strategy.variables.filter(item => item.id !== v.id),
                            })
                          }
                          className="p-0.5 text-rose-500 opacity-70 hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Center Visual Block Workspace Canvas */}
        <div
          className={`flex-1 overflow-auto p-4 sm:p-6 ${
            isDark ? 'workspace-dot-grid-dark' : 'workspace-dot-grid-light'
          }`}
        >
          {showXmlPreview ? (
            <div
              className={`max-w-4xl mx-auto rounded-xl border overflow-hidden shadow-lg ${
                isDark ? 'bg-[#14171c] border-[#2c333d]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold">
                  Generated Deriv Bot Blockly XML ({strategy.name}.xml)
                </span>
                <button
                  type="button"
                  onClick={() => setShowXmlPreview(false)}
                  className="text-xs font-semibold text-[#00a79e] hover:underline"
                >
                  Back to Visual Blocks
                </button>
              </div>
              <pre className="p-4 text-[11px] font-mono overflow-x-auto leading-relaxed opacity-90">
                {strategyToDerivXml(strategy)}
              </pre>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoomPct / 100})`,
                transformOrigin: 'top left',
              }}
              className="max-w-5xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-5 pb-12 transition-transform"
            >
              {/* ============================================================
                  ROOT BLOCK 1: TRADE PARAMETERS (Deriv Navy #2a3052)
                 ============================================================ */}
              <div
                className={`rounded-xl overflow-hidden shadow-md border-2 transition-all ${
                  activeExecutingBlock === 'trade_params'
                    ? 'border-[#3bf75a] ring-4 ring-[#3bf75a]/20'
                    : 'border-[#2a3052]'
                } ${isDark ? 'bg-[#1c212b]' : 'bg-white'}`}
              >
                <div className="bg-[#2a3052] text-white px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/assets/icons/IcTradetypeAccu.svg" alt="" className="w-4 h-4 invert" />
                    <span className="font-bold text-xs tracking-wide">
                      1. Trade parameters
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/15">
                    Run Once at Start
                  </span>
                </div>

                {/* Inner Interlocking Sub-blocks */}
                <div className="p-3.5 space-y-3 text-xs">
                  {/* Market & Symbol Sub-block */}
                  <div className="rounded-lg bg-[#323a63] text-white p-3 space-y-2.5 shadow-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold opacity-90">Market:</span>
                      <select
                        value={strategy.symbol}
                        onChange={e => handleSymbolChange(e.target.value)}
                        className="px-2.5 py-1 rounded bg-[#1e2442] border border-white/20 text-white font-semibold text-xs focus:outline-none"
                      >
                        {MARKET_SYMBOLS.map(s => (
                          <option key={s.symbol} value={s.symbol}>
                            {s.marketLabel} — {s.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold opacity-90">Trade Type:</span>
                      <select
                        value={strategy.tradeType}
                        onChange={e => handleTradeTypeChange(e.target.value as TradeTypeGroup)}
                        className="px-2.5 py-1 rounded bg-[#1e2442] border border-white/20 text-white font-semibold text-xs focus:outline-none"
                      >
                        {TRADE_TYPE_OPTIONS.map(g => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold opacity-90">Contract Type:</span>
                      <select
                        value={strategy.contractDirection}
                        onChange={e =>
                          updateStrategy({
                            contractDirection: e.target.value as ContractDirection,
                          })
                        }
                        className="px-2.5 py-1 rounded bg-[#1e2442] border border-white/20 text-[#3bf75a] font-bold text-xs focus:outline-none"
                      >
                        {currentTradeGroup.directions.map(d => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>

                      <span className="font-semibold opacity-90 ml-auto">Candle Interval:</span>
                      <select
                        value={strategy.candleInterval}
                        onChange={e =>
                          updateStrategy({ candleInterval: Number(e.target.value) })
                        }
                        className="px-2 py-1 rounded bg-[#1e2442] border border-white/20 text-white text-xs"
                      >
                        <option value={60}>1 minute</option>
                        <option value={120}>2 minutes</option>
                        <option value={300}>5 minutes</option>
                        <option value={900}>15 minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* Trade Options Sub-block */}
                  <div
                    className={`rounded-lg border p-3 space-y-2.5 ${
                      isDark
                        ? 'bg-[#141820] border-[#2e3646]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[11px] uppercase tracking-wider text-[#00a79e]">
                      Trade Options
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] opacity-70 mb-1">Duration</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={strategy.duration}
                            onChange={e =>
                              updateStrategy({
                                duration: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className={`w-16 px-2 py-1 rounded border font-mono text-xs ${inlineFieldCls}`}
                          />
                          <select
                            value={strategy.durationUnit}
                            onChange={e =>
                              updateStrategy({
                                durationUnit: e.target.value as 't' | 's' | 'm',
                              })
                            }
                            className={`flex-1 px-2 py-1 rounded border text-xs ${inlineFieldCls}`}
                          >
                            <option value="t">Ticks</option>
                            <option value="s">Seconds</option>
                            <option value="m">Minutes</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] opacity-70 mb-1">
                          Initial Stake ({activeAccount.currency})
                        </label>
                        <input
                          type="number"
                          min={0.35}
                          step="0.5"
                          value={strategy.initialStake}
                          onChange={e =>
                            updateStrategy({
                              initialStake: Math.max(0.35, parseFloat(e.target.value) || 0.35),
                            })
                          }
                          className={`w-full px-2.5 py-1 rounded border font-mono font-bold text-xs ${inlineFieldCls}`}
                        />
                      </div>
                    </div>

                    {/* Conditional Digit Prediction or Accumulator Growth Rate */}
                    {(strategy.tradeType === 'digits_over_under' ||
                      strategy.tradeType === 'digits_match_diff') && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold">Last Digit Prediction (0–9):</span>
                        <input
                          type="number"
                          min={0}
                          max={9}
                          value={strategy.prediction}
                          onChange={e =>
                            updateStrategy({
                              prediction: Math.min(
                                9,
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              ),
                            })
                          }
                          className={`w-20 px-2.5 py-1 rounded border font-mono font-bold text-center ${inlineFieldCls}`}
                        />
                      </div>
                    )}

                    {strategy.tradeType === 'accumulators' && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-semibold">Accumulator Growth Rate:</span>
                        <div className="flex gap-1">
                          {[0.01, 0.02, 0.03, 0.04, 0.05].map(rate => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => updateStrategy({ growthRate: rate })}
                              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                                strategy.growthRate === rate
                                  ? 'bg-[#00a79e] text-white'
                                  : isDark
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {Math.round(rate * 100)}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isBotRunning && (
                      <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#00a79e]">
                        <span>Live Active Stake:</span>
                        <span className="font-bold">
                          {currentStake} {activeAccount.currency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ============================================================
                  ROOT BLOCK 2: PURCHASE CONDITIONS (Deriv Teal #00a79e)
                 ============================================================ */}
              <div
                className={`rounded-xl overflow-hidden shadow-md border-2 transition-all ${
                  activeExecutingBlock === 'purchase'
                    ? 'border-[#3bf75a] ring-4 ring-[#3bf75a]/25'
                    : 'border-[#00a79e]'
                } ${isDark ? 'bg-[#1c212b]' : 'bg-white'}`}
              >
                <div className="bg-[#00a79e] text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-xs tracking-wide">
                    2. Purchase conditions
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/20">
                    Evaluated Every Tick
                  </span>
                </div>

                <div className="p-3.5 space-y-3 text-xs">
                  <div
                    className={`rounded-lg border p-3 space-y-2.5 ${
                      isDark
                        ? 'bg-[#141820] border-[#2e3646]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#00a79e]">IF</span>
                      <select
                        value={strategy.conditionType}
                        onChange={e =>
                          updateStrategy({
                            conditionType: e.target.value as PurchaseConditionType,
                          })
                        }
                        className={`flex-1 px-2.5 py-1.5 rounded border font-semibold text-xs ${inlineFieldCls}`}
                      >
                        <option value="every_tick">Every incoming market tick (Immediate)</option>
                        <option value="sma_cross">Fast SMA crosses Slow SMA</option>
                        <option value="rsi_threshold">RSI (Relative Strength Index) hits threshold</option>
                        <option value="bollinger_breakout">Spot touches Bollinger Band (14, 1.8σ)</option>
                        <option value="last_digit_streak">Last Digit consecutive streak</option>
                        <option value="candle_color">Current OHLC Candle direction matches</option>
                      </select>
                    </div>

                    {strategy.conditionType === 'sma_cross' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] opacity-70 mb-1">Fast SMA Period</label>
                          <input
                            type="number"
                            min={2}
                            max={50}
                            value={strategy.fastPeriod}
                            onChange={e =>
                              updateStrategy({ fastPeriod: Math.max(2, Number(e.target.value) || 5) })
                            }
                            className={`w-full px-2 py-1 rounded border font-mono ${inlineFieldCls}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] opacity-70 mb-1">Slow SMA Period</label>
                          <input
                            type="number"
                            min={3}
                            max={100}
                            value={strategy.slowPeriod}
                            onChange={e =>
                              updateStrategy({ slowPeriod: Math.max(3, Number(e.target.value) || 14) })
                            }
                            className={`w-full px-2 py-1 rounded border font-mono ${inlineFieldCls}`}
                          />
                        </div>
                      </div>
                    )}

                    {strategy.conditionType === 'rsi_threshold' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] opacity-70 mb-1">RSI Period</label>
                          <input
                            type="number"
                            min={3}
                            max={50}
                            value={strategy.rsiPeriod}
                            onChange={e =>
                              updateStrategy({ rsiPeriod: Math.max(3, Number(e.target.value) || 14) })
                            }
                            className={`w-full px-2 py-1 rounded border font-mono ${inlineFieldCls}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] opacity-70 mb-1">
                            Trigger Threshold (≤)
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={90}
                            value={strategy.rsiThreshold}
                            onChange={e =>
                              updateStrategy({
                                rsiThreshold: Math.min(90, Math.max(10, Number(e.target.value) || 35)),
                              })
                            }
                            className={`w-full px-2 py-1 rounded border font-mono ${inlineFieldCls}`}
                          />
                        </div>
                      </div>
                    )}

                    {strategy.conditionType === 'last_digit_streak' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[11px] opacity-70 mb-1">Consecutive Ticks</label>
                          <input
                            type="number"
                            min={1}
                            max={6}
                            value={strategy.digitStreakCount}
                            onChange={e =>
                              updateStrategy({
                                digitStreakCount: Math.min(6, Math.max(1, Number(e.target.value) || 2)),
                              })
                            }
                            className={`w-full px-2 py-1 rounded border font-mono ${inlineFieldCls}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] opacity-70 mb-1">Streak Pattern</label>
                          <select
                            value={strategy.digitStreakTarget}
                            onChange={e =>
                              updateStrategy({
                                digitStreakTarget: e.target.value as
                                  | 'even'
                                  | 'odd'
                                  | 'over5'
                                  | 'under5',
                              })
                            }
                            className={`w-full px-2 py-1 rounded border ${inlineFieldCls}`}
                          >
                            <option value="even">Even Digits</option>
                            <option value="odd">Odd Digits</option>
                            <option value="over5">Digits &gt; 5</option>
                            <option value="under5">Digits &lt; 5</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* THEN PURCHASE Action */}
                    <div className="mt-2 pt-2.5 border-t border-slate-200 dark:border-slate-700/70 flex items-center justify-between">
                      <span className="font-bold text-[#00a79e]">THEN Purchase</span>
                      <span className="px-3 py-1 rounded-md bg-[#2a3052] text-[#3bf75a] font-bold font-mono">
                        {
                          currentTradeGroup.directions.find(
                            d => d.value === strategy.contractDirection
                          )?.label
                        }
                      </span>
                    </div>
                  </div>

                  {/* Block 3: Optional Sell Conditions Nested Card */}
                  <div
                    className={`rounded-lg border p-3 transition-colors ${
                      activeExecutingBlock === 'during'
                        ? 'border-[#3bf75a] bg-[#3bf75a]/5'
                        : isDark
                        ? 'bg-[#141820] border-[#2e3646]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs">3. Sell conditions (During Purchase)</div>
                        <div className="text-[11px] opacity-65">
                          Lock in early profit if open contract exceeds target %
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={strategy.enableSellConditions}
                        onChange={e =>
                          updateStrategy({ enableSellConditions: e.target.checked })
                        }
                        className="w-4 h-4 accent-[#00a79e] rounded cursor-pointer"
                      />
                    </div>

                    {strategy.enableSellConditions && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span>Sell at Market if Profit ≥</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={10}
                            max={200}
                            value={strategy.sellTakeProfitPct}
                            onChange={e =>
                              updateStrategy({
                                sellTakeProfitPct: Math.max(10, Number(e.target.value) || 45),
                              })
                            }
                            className={`w-16 px-2 py-1 rounded border font-mono text-right ${inlineFieldCls}`}
                          />
                          <span className="font-bold">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ============================================================
                  ROOT BLOCK 4: RESTART TRADING CONDITIONS & RISK MANAGEMENT
                 ============================================================ */}
              <div
                className={`xl:col-span-2 rounded-xl overflow-hidden shadow-md border-2 transition-all ${
                  activeExecutingBlock === 'restart'
                    ? 'border-[#3bf75a] ring-4 ring-[#3bf75a]/25'
                    : 'border-[#2a3052]'
                } ${isDark ? 'bg-[#1c212b]' : 'bg-white'}`}
              >
                <div className="bg-[#2a3052] text-white px-4 py-2.5 flex items-center justify-between">
                  <span className="font-bold text-xs tracking-wide">
                    4. Restart trading conditions (After Purchase & Money Management)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/15">
                    Executes On Contract Settlement
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Progression System */}
                  <div
                    className={`rounded-lg border p-3 space-y-2.5 ${
                      isDark ? 'bg-[#141820] border-[#2e3646]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <label className="block font-bold text-[#00a79e]">
                      Stake Progression System
                    </label>
                    <select
                      value={strategy.strategySystem}
                      onChange={e =>
                        updateStrategy({
                          strategySystem: e.target.value as StrategySystemType,
                        })
                      }
                      className={`w-full px-2.5 py-1.5 rounded border font-semibold ${inlineFieldCls}`}
                    >
                      {QUICK_STRATEGIES.map(qs => (
                        <option key={qs.id} value={qs.id}>
                          {qs.label}
                        </option>
                      ))}
                      <option value="CUSTOM_FLAT">Flat Stake (Fixed Initial Stake)</option>
                    </select>

                    {(strategy.strategySystem === 'MARTINGALE' ||
                      strategy.strategySystem === 'REVERSE_MARTINGALE') && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="opacity-75">Size Multiplier:</span>
                        <input
                          type="number"
                          min={1.1}
                          max={10}
                          step="0.1"
                          value={strategy.sizeMultiplier}
                          onChange={e =>
                            updateStrategy({
                              sizeMultiplier: Math.max(1.1, parseFloat(e.target.value) || 2),
                            })
                          }
                          className={`w-20 px-2 py-1 rounded border font-mono text-right ${inlineFieldCls}`}
                        />
                      </div>
                    )}

                    {(strategy.strategySystem === 'D_ALEMBERT' ||
                      strategy.strategySystem === 'REVERSE_D_ALEMBERT') && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="opacity-75">Unit Increment:</span>
                        <input
                          type="number"
                          min={0.5}
                          max={20}
                          step="0.5"
                          value={strategy.unitAmount}
                          onChange={e =>
                            updateStrategy({
                              unitAmount: Math.max(0.5, parseFloat(e.target.value) || 1),
                            })
                          }
                          className={`w-20 px-2 py-1 rounded border font-mono text-right ${inlineFieldCls}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Column 2: Take Profit & Stop Loss Thresholds */}
                  <div
                    className={`rounded-lg border p-3 space-y-2.5 ${
                      isDark ? 'bg-[#141820] border-[#2e3646]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-[#00a79e]">Session Profit / Loss Guards</div>

                    <div className="flex items-center justify-between">
                      <span className="opacity-80">Take Profit ({activeAccount.currency}):</span>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={strategy.takeProfit}
                        onChange={e =>
                          updateStrategy({
                            takeProfit: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className={`w-24 px-2 py-1 rounded border font-mono font-bold text-emerald-500 text-right ${inlineFieldCls}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="opacity-80">Stop Loss ({activeAccount.currency}):</span>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={strategy.stopLoss}
                        onChange={e =>
                          updateStrategy({
                            stopLoss: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        className={`w-24 px-2 py-1 rounded border font-mono font-bold text-[#ff444f] text-right ${inlineFieldCls}`}
                      />
                    </div>
                  </div>

                  {/* Column 3: Maximum Stake Cap & Cooldown */}
                  <div
                    className={`rounded-lg border p-3 space-y-2.5 ${
                      isDark ? 'bg-[#141820] border-[#2e3646]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#00a79e]">Max Stake Protection</span>
                      <input
                        type="checkbox"
                        checked={strategy.maxStakeEnabled}
                        onChange={e => updateStrategy({ maxStakeEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[#00a79e]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="opacity-80">Maximum Stake:</span>
                      <input
                        type="number"
                        min={1}
                        disabled={!strategy.maxStakeEnabled}
                        value={strategy.maxStake}
                        onChange={e =>
                          updateStrategy({
                            maxStake: Math.max(1, parseFloat(e.target.value) || 64),
                          })
                        }
                        className={`w-24 px-2 py-1 rounded border font-mono text-right disabled:opacity-40 ${inlineFieldCls}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="opacity-80">Cooldown (Ticks):</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={strategy.cooldownTicks}
                        onChange={e =>
                          updateStrategy({
                            cooldownTicks: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className={`w-20 px-2 py-1 rounded border font-mono text-right ${inlineFieldCls}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Help Modal */}
      {helpItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">{helpItem.label}</h3>
              <button
                type="button"
                onClick={() => setHelpItem(null)}
                className="p-1 rounded hover:bg-slate-200/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs leading-relaxed opacity-85">{helpItem.description}</p>
              {helpItem.helpImg && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white p-2">
                  <img
                    src={helpItem.helpImg}
                    alt={helpItem.label}
                    className="max-h-56 mx-auto object-contain"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHelpItem(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    helpItem.apply();
                    setHelpItem(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#00a79e] text-white text-xs font-semibold"
                >
                  Apply to Strategy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
