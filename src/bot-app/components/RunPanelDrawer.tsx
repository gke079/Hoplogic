import React, { useMemo, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  HelpCircle,
  Download,
  Filter,
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  Eye,
  Gauge,
  Zap,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import { ContractStage, JournalLogType, RunPanelTab } from '../types/bot.types';
import { MARKET_SYMBOLS } from '../constants/markets-and-strategies';

export const RunPanelDrawer: React.FC = () => {
  const {
    isDark,
    isDrawerOpen,
    setIsDrawerOpen,
    isBotRunning,
    isBotPaused,
    executionMode,
    setExecutionMode,
    contractStage,
    currentStake,
    startBot,
    pauseBot,
    resumeBot,
    stopBot,
    runPanelTab,
    setRunPanelTab,
    openContract,
    lastContract,
    transactions,
    journal,
    statistics,
    clearStatsAndLogs,
    activeAccount,
    setSelectedContractDetail,
  } = useBot();

  const [isStatsInfoOpen, setIsStatsInfoOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [journalFilter, setJournalFilter] = useState<'all' | JournalLogType>('all');

  const stageLabel = useMemo(() => {
    if (isBotPaused) {
      return openContract ? 'Finishing contract → Pausing...' : 'Bot is paused';
    }
    const fastPrefix = executionMode === 'fast' && isBotRunning ? 'Fast • ' : '';
    switch (contractStage) {
      case ContractStage.PAUSED:
        return 'Bot is paused';
      case ContractStage.STARTING:
        return `${fastPrefix}Bot is starting...`;
      case ContractStage.PURCHASE_SENT:
        return `${fastPrefix}Evaluating conditions...`;
      case ContractStage.PURCHASE_RECEIVED:
        return `${fastPrefix}Purchase successful`;
      case ContractStage.CONTRACT_CLOSED:
        return isBotRunning ? `${fastPrefix}Preparing next cycle` : 'Contract closed';
      case ContractStage.STOPPING:
        return 'Stopping bot...';
      case ContractStage.NOT_RUNNING:
      default:
        return 'Bot is not running';
    }
  }, [contractStage, executionMode, isBotPaused, isBotRunning, openContract]);

  const activeStageDot = useMemo(() => {
    if (!isBotRunning && contractStage === ContractStage.NOT_RUNNING) return 0;
    if (isBotPaused && !openContract) return 1;
    if (contractStage === ContractStage.STARTING || contractStage === ContractStage.PURCHASE_SENT) return 1;
    if (contractStage === ContractStage.PURCHASE_RECEIVED) return 2;
    return 3;
  }, [contractStage, isBotPaused, isBotRunning, openContract]);

  const summaryCardContract = openContract || lastContract;

  const filteredJournal = useMemo(() => {
    if (journalFilter === 'all') return journal;
    return journal.filter(j => j.type === journalFilter);
  }, [journal, journalFilter]);

  const exportTransactionsCsv = () => {
    if (transactions.length === 0) return;
    const header = 'Reference ID,Timestamp,Symbol,Contract,Buy Price,Payout,Profit/Loss,Entry Spot,Exit Spot,Status\n';
    const rows = transactions
      .map(
        tx =>
          `${tx.referenceId},${new Date(tx.startTime).toISOString()},"${tx.symbolName}","${tx.contractLabel}",${tx.buyPrice},${tx.payout},${tx.profit},${tx.entrySpot},${tx.exitSpot ?? ''},${tx.status}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hopelogic_transactions_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <>
      <aside
        className={`w-full sm:w-[366px] border-l flex flex-col shrink-0 z-20 select-none ${
          isDark
            ? 'bg-[#15171a] border-[#262b33] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Run / Pause / Resume / Stop Controls + Execution Mode Selector */}
        <div
          className={`p-3.5 border-b space-y-2.5 ${
            isDark ? 'border-[#262b33] bg-[#181b1f]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {!isBotRunning ? (
              <button
                id="db-animation__run-button"
                type="button"
                onClick={() => startBot()}
                className="px-4 py-2.5 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                {!isBotPaused ? (
                  <button
                    id="db-animation__pause-button"
                    type="button"
                    onClick={() => pauseBot()}
                    title="Pause new trades (preserves active stake & session counters)"
                    className="px-3 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    id="db-animation__resume-button"
                    type="button"
                    onClick={() => resumeBot()}
                    title="Resume automated trading"
                    className="px-3 py-2.5 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </button>
                )}

                <button
                  id="db-animation__stop-button"
                  type="button"
                  onClick={() => stopBot()}
                  title="Stop bot completely"
                  className="px-3 py-2.5 rounded-lg bg-[#ff444f] hover:bg-[#e03842] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* 3-Step Stage Indicator */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate mb-1.5 flex items-center gap-1">
                {isBotPaused && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                )}
                <span className="truncate">{stageLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex-1 flex items-center gap-1">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        activeStageDot >= step
                          ? isBotPaused
                            ? 'bg-amber-500'
                            : step === 3 && lastContract?.status === 'lost' && !openContract
                            ? 'bg-[#ff444f]'
                            : 'bg-[#00a79e]'
                          : isDark
                          ? 'bg-slate-700'
                          : 'bg-slate-200'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              title="Collapse Run Panel"
              className="p-1.5 rounded-md opacity-65 hover:opacity-100 hover:bg-slate-200/50 dark:hover:bg-slate-800 shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Bot Execution Mode Toggle: Normal Mode / Fast Mode */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div
              role="group"
              aria-label="Bot Execution Mode"
              className={`inline-flex p-0.5 rounded-lg border text-[11px] font-semibold ${
                isDark
                  ? 'bg-[#111418] border-[#262b33]'
                  : 'bg-white border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setExecutionMode('normal')}
                title="Standard tick-by-tick Deriv market execution and cooldowns"
                className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  executionMode === 'normal'
                    ? 'bg-[#00a79e] text-white font-bold shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Gauge className="w-3 h-3" />
                <span>Normal Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setExecutionMode('fast')}
                title="Turbo sub-second execution with zero cooldown between contracts"
                className={`px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  executionMode === 'fast'
                    ? 'bg-[#3bf75a] text-slate-950 font-bold shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Fast Mode</span>
              </button>
            </div>

            <div className="text-[10px] font-mono opacity-75 truncate">
              Stake: <span className="font-bold">{currentStake.toFixed(2)} {activeAccount.currency}</span>
            </div>
          </div>
        </div>

        {/* 3 Tabs: Summary | Transactions | Journal */}
        <div
          className={`grid grid-cols-3 border-b text-xs font-semibold shrink-0 ${
            isDark ? 'border-[#262b33]' : 'border-slate-200'
          }`}
        >
          {[
            { id: RunPanelTab.SUMMARY, label: 'Summary' },
            { id: RunPanelTab.TRANSACTIONS, label: `Transactions (${transactions.length})` },
            { id: RunPanelTab.JOURNAL, label: 'Journal' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setRunPanelTab(t.id)}
              className={`py-2.5 text-center border-b-2 transition-colors truncate px-1 ${
                runPanelTab === t.id
                  ? 'border-[#ff444f] text-[#ff444f] font-bold'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* TAB 0: SUMMARY */}
          {runPanelTab === RunPanelTab.SUMMARY && (
            <div className="space-y-3">
              {!summaryCardContract ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <img
                    src="/assets/icons/IcBox.svg"
                    alt=""
                    className={`w-10 h-10 mx-auto opacity-45 ${isDark ? 'invert' : ''}`}
                  />
                  <div className="text-xs font-bold">When you&apos;re ready to trade, hit Run</div>
                  <p className="text-[11px] opacity-65 leading-relaxed">
                    You&apos;ll be able to track your bot&apos;s live contract spot trajectory and settlement results here.
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => setSelectedContractDetail(summaryCardContract)}
                  className={`cursor-pointer rounded-xl border p-3.5 space-y-3 relative overflow-hidden transition-colors ${
                    isDark
                      ? 'bg-[#1c2026] border-[#2e3540] hover:border-[#00a79e]'
                      : 'bg-slate-50/80 border-slate-200 hover:border-[#00a79e]'
                  }`}
                >
                  {/* Header: Symbol & Status Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs">{summaryCardContract.symbolName}</div>
                      <div className="text-[11px] opacity-70">
                        {summaryCardContract.contractLabel} • ID {summaryCardContract.referenceId.slice(-6)}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        summaryCardContract.status === 'open'
                          ? 'bg-sky-500/15 text-sky-400'
                          : summaryCardContract.status === 'won'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      {summaryCardContract.status === 'open'
                        ? `Tick ${summaryCardContract.elapsedTicks}/${summaryCardContract.durationTicks}`
                        : summaryCardContract.status}
                    </span>
                  </div>

                  {/* Tick Progress Bar */}
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (summaryCardContract.elapsedTicks /
                            Math.max(1, summaryCardContract.durationTicks)) *
                            100
                        )}%`,
                      }}
                      className={`h-full transition-all ${
                        summaryCardContract.status === 'lost'
                          ? 'bg-[#ff444f]'
                          : 'bg-[#00a79e]'
                      }`}
                    />
                  </div>

                  {/* Spot & Price Grid */}
                  {(() => {
                    const sym =
                      MARKET_SYMBOLS.find(m => m.symbol === summaryCardContract.symbol) ||
                      MARKET_SYMBOLS[0];
                    return (
                      <div className="grid grid-cols-2 gap-2.5 text-xs pt-1">
                        <div>
                          <div className="text-[10px] opacity-60">Entry spot</div>
                          <div className="font-mono font-semibold">
                            {summaryCardContract.entrySpot.toFixed(sym.pipSize)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] opacity-60">
                            {summaryCardContract.status === 'open' ? 'Current spot' : 'Exit spot'}
                          </div>
                          <div className="font-mono font-semibold">
                            {(
                              summaryCardContract.exitSpot ?? summaryCardContract.currentSpot
                            ).toFixed(sym.pipSize)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] opacity-60">Buy price</div>
                          <div className="font-mono font-semibold">
                            {summaryCardContract.buyPrice.toFixed(2)} {summaryCardContract.currency}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] opacity-60">Profit / Loss</div>
                          <div
                            className={`font-mono font-bold ${
                              summaryCardContract.profit >= 0 ? 'text-emerald-500' : 'text-[#ff444f]'
                            }`}
                          >
                            {summaryCardContract.profit >= 0 ? '+' : ''}
                            {summaryCardContract.profit.toFixed(2)} {summaryCardContract.currency}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-end gap-1 text-[11px] font-semibold text-[#00a79e]">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect contract details</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: TRANSACTIONS */}
          {runPanelTab === RunPanelTab.TRANSACTIONS && (
            <div className="space-y-2">
              {transactions.length > 0 && (
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={exportTransactionsCsv}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00a79e] hover:underline"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download CSV</span>
                  </button>
                </div>
              )}

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-xs opacity-65">
                  No executed contracts in this session yet.
                </div>
              ) : (
                transactions.map(tx => {
                  const sym =
                    MARKET_SYMBOLS.find(m => m.symbol === tx.symbol) || MARKET_SYMBOLS[0];
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => setSelectedContractDetail(tx)}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between gap-2 transition-colors ${
                        isDark
                          ? 'bg-[#1b1f25] border-[#2b313b] hover:border-[#00a79e]'
                          : 'bg-slate-50 border-slate-200 hover:border-[#00a79e]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                            tx.status === 'won'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : tx.status === 'lost'
                              ? 'bg-rose-500/15 text-rose-500'
                              : 'bg-sky-500/15 text-sky-400'
                          }`}
                        >
                          {tx.profit >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {sym.shortCode} • {tx.contractLabel}
                          </div>
                          <div className="text-[10px] font-mono opacity-65 truncate">
                            {tx.entrySpot.toFixed(sym.pipSize)} →{' '}
                            {(tx.exitSpot ?? tx.currentSpot).toFixed(sym.pipSize)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <div className="text-[11px] opacity-75">{tx.buyPrice.toFixed(2)}</div>
                        <div
                          className={`text-xs font-bold ${
                            tx.status === 'open'
                              ? 'text-sky-400'
                              : tx.profit >= 0
                              ? 'text-emerald-500'
                              : 'text-[#ff444f]'
                          }`}
                        >
                          {tx.status === 'open'
                            ? 'OPEN'
                            : `${tx.profit >= 0 ? '+' : ''}${tx.profit.toFixed(2)}`}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: JOURNAL */}
          {runPanelTab === RunPanelTab.JOURNAL && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold opacity-75">
                  <Filter className="w-3 h-3" />
                  Filter:
                </span>
                <div className="flex gap-1">
                  {(['all', 'notify', 'success', 'error'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setJournalFilter(f)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        journalFilter === f
                          ? 'bg-[#00a79e] text-white'
                          : isDark
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filteredJournal.length === 0 ? (
                <div className="py-12 text-center text-xs opacity-65">
                  There are no messages to display.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredJournal.map(entry => (
                    <div
                      key={entry.id}
                      className={`p-2 rounded-lg border text-[11px] leading-relaxed ${
                        entry.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                          : entry.type === 'error'
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
                          : entry.type === 'warn'
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                          : entry.type === 'notify'
                          ? isDark
                            ? 'bg-sky-500/10 border-sky-500/25 text-sky-300'
                            : 'bg-sky-50 border-sky-200 text-sky-900'
                          : isDark
                          ? 'bg-[#1b1f25] border-[#282e37] text-slate-300'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-mono text-[10px] opacity-65 mb-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                      <div>{entry.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom 6-Tile Statistics Summary + Active Reset Button */}
        <div
          className={`border-t p-3.5 space-y-3 shrink-0 ${
            isDark ? 'border-[#262b33] bg-[#181b1f]' : 'border-slate-200 bg-slate-50/70'
          }`}
        >
          {runPanelTab !== RunPanelTab.JOURNAL && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                  Session Statistics
                </span>
                <button
                  type="button"
                  onClick={() => setIsStatsInfoOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00a79e] hover:underline"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>What&apos;s this?</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  className={`p-2 rounded-lg border ${
                    isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] opacity-65">Total stake</div>
                  <div className="text-xs font-bold font-mono mt-0.5">
                    {statistics.totalStake.toFixed(2)} {activeAccount.currency}
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border ${
                    isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] opacity-65">Total payout</div>
                  <div className="text-xs font-bold font-mono mt-0.5">
                    {statistics.totalPayout.toFixed(2)} {activeAccount.currency}
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border ${
                    isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] opacity-65">No. of runs</div>
                  <div className="text-xs font-bold font-mono mt-0.5">
                    {statistics.numberOfRuns}
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border ${
                    isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] opacity-65">Contracts lost</div>
                  <div className="text-xs font-bold font-mono text-[#ff444f] mt-0.5">
                    {statistics.lostContracts}
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border ${
                    isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] opacity-65">Contracts won</div>
                  <div className="text-xs font-bold font-mono text-emerald-500 mt-0.5">
                    {statistics.wonContracts}
                  </div>
                </div>

                <div
                  className={`p-2 rounded-lg border ${
                    isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="text-[10px] opacity-65">Total profit/loss</div>
                  <div
                    className={`text-xs font-bold font-mono mt-0.5 ${
                      statistics.totalProfit > 0
                        ? 'text-emerald-500'
                        : statistics.totalProfit < 0
                        ? 'text-[#ff444f]'
                        : ''
                    }`}
                  >
                    {statistics.totalProfit > 0 ? '+' : ''}
                    {statistics.totalProfit.toFixed(2)} {activeAccount.currency}
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            id="db-run-panel__clear-button"
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className={`w-full py-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#121519] border-slate-600 hover:border-[#ff444f] hover:text-[#ff444f] text-slate-100'
                : 'bg-white border-slate-300 hover:border-[#ff444f] hover:text-[#ff444f] text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </aside>

      {/* Reset Confirmation Modal ("Are you sure?") */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">Are you sure?</h3>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="p-1 rounded hover:bg-slate-200/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-xs leading-relaxed opacity-85">
                {isBotRunning
                  ? 'Your running bot will be stopped, and this will clear all data in the summary, transactions, and journal panels. All counters will be reset to zero.'
                  : 'This will clear all data in the summary, transactions, and journal panels. All counters will be reset to zero.'}
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className={`px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${
                    isDark
                      ? 'border-slate-600 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearStatsAndLogs();
                    setIsResetConfirmOpen(false);
                  }}
                  className="px-5 py-2 rounded-lg bg-[#ff444f] hover:bg-[#e03842] text-white text-xs font-bold transition-colors"
                >
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics "What's this?" Modal */}
      {isStatsInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">What&apos;s this?</h3>
              <button
                type="button"
                onClick={() => setIsStatsInfoOpen(false)}
                className="p-1 rounded hover:bg-slate-200/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
              <div>
                <div className="font-bold">Total stake</div>
                <div className="opacity-75">Total stake placed since you last cleared your stats.</div>
              </div>
              <div>
                <div className="font-bold">Total payout</div>
                <div className="opacity-75">Total payout credited since you last cleared your stats.</div>
              </div>
              <div>
                <div className="font-bold">No. of runs</div>
                <div className="opacity-75">
                  The number of completed contract cycles your bot has executed since reset.
                </div>
              </div>
              <div>
                <div className="font-bold">Contracts lost / won</div>
                <div className="opacity-75">
                  Count of settled contracts closing out-of-the-money vs in-the-money.
                </div>
              </div>
              <div>
                <div className="font-bold">Total profit/loss</div>
                <div className="opacity-75">
                  Net session profit or loss (Total payout minus Total stake).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
