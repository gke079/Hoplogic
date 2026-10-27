import React, { useRef, useState } from 'react';
import {
  X,
  Upload,
  FolderOpen,
  Sparkles,
  Cloud,
  Save,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import { MARKET_SYMBOLS, SAMPLE_STRATEGIES } from '../constants/markets-and-strategies';

export const LoadSaveModals: React.FC = () => {
  const {
    isDark,
    isLoadModalOpen,
    setIsLoadModalOpen,
    isSaveModalOpen,
    setIsSaveModalOpen,
    savedStrategies,
    loadStrategyIntoBuilder,
    importXmlContent,
    strategy,
    saveCurrentStrategy,
    selectedContractDetail,
    setSelectedContractDetail,
  } = useBot();

  // Load Modal State
  const [loadTab, setLoadTab] = useState<'local' | 'recent' | 'samples' | 'gdrive'>('local');
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save Modal State
  const [botNameInput, setBotNameInput] = useState(strategy.name);
  const [downloadAsXml, setDownloadAsXml] = useState(true);

  const handleFilePicked = (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        importXmlContent(text, file.name);
        setIsLoadModalOpen(false);
      } catch (err: any) {
        setImportError(err?.message || 'Unable to parse XML bot file.');
      }
    };
    reader.onerror = () => setImportError('Failed to read selected file.');
    reader.readAsText(file);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCurrentStrategy(botNameInput || strategy.name, downloadAsXml);
    setIsSaveModalOpen(false);
  };

  const hasGoogleDriveCreds = Boolean(
    import.meta.env.VITE_GD_CLIENT_ID &&
      import.meta.env.VITE_GD_APP_ID &&
      import.meta.env.VITE_GD_API_KEY
  );

  return (
    <>
      {/* =====================================================================
          1. LOAD STRATEGY MODAL (Local XML / Recent / Sample Bots / Google Drive)
         ===================================================================== */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[86vh] ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#262b33] flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Load strategy</h3>
              <button
                type="button"
                onClick={() => {
                  setImportError(null);
                  setIsLoadModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div
              className={`grid grid-cols-4 border-b text-xs font-semibold ${
                isDark ? 'border-[#262b33]' : 'border-slate-200'
              }`}
            >
              {[
                { id: 'local' as const, label: 'Local (.xml)', icon: Upload },
                { id: 'recent' as const, label: 'Recent', icon: FolderOpen },
                { id: 'samples' as const, label: 'Templates', icon: Sparkles },
                { id: 'gdrive' as const, label: 'Google Drive', icon: Cloud },
              ].map(t => {
                const Icon = t.icon;
                const active = loadTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setImportError(null);
                      setLoadTab(t.id);
                    }}
                    className={`py-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                      active
                        ? 'border-[#ff444f] text-[#ff444f] font-bold'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {loadTab === 'local' && (
                <div className="space-y-4">
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFilePicked(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center space-y-3 transition-colors ${
                      isDragging
                        ? 'border-[#00a79e] bg-[#00a79e]/10'
                        : isDark
                        ? 'border-slate-700 hover:border-[#00a79e] bg-[#121519]'
                        : 'border-slate-300 hover:border-[#00a79e] bg-slate-50/70'
                    }`}
                  >
                    <img
                      src="/assets/icons/IcMyComputer.svg"
                      alt=""
                      className={`w-12 h-12 mx-auto ${isDark ? 'invert brightness-150' : ''}`}
                    />
                    <div className="font-bold text-sm">
                      Drag and drop your Deriv Bot (.xml) file here
                    </div>
                    <p className="text-xs opacity-65">
                      Supports both standard Deriv DBot Blockly XML files and HopeLogic strategy exports.
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00a79e] text-white text-xs font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse My Computer</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xml,text/xml,application/xml"
                      className="hidden"
                      onChange={e => handleFilePicked(e.target.files?.[0])}
                    />
                  </div>

                  {importError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                      {importError}
                    </div>
                  )}
                </div>
              )}

              {loadTab === 'recent' && (
                <div className="space-y-2">
                  {savedStrategies.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark
                          ? 'bg-[#121519] border-[#262b33]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{item.name}</div>
                        <div className="text-[11px] opacity-65 mt-0.5">
                          {item.symbol} • {item.strategySystem} • Stake: {item.initialStake}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          loadStrategyIntoBuilder(item, true);
                          setIsLoadModalOpen(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold shrink-0"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {loadTab === 'samples' && (
                <div className="space-y-2.5">
                  {SAMPLE_STRATEGIES.map(tpl => (
                    <div
                      key={tpl.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDark
                          ? 'bg-[#121519] border-[#262b33]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs">{tpl.name}</div>
                        <p className="text-[11px] opacity-75">{tpl.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          loadStrategyIntoBuilder(tpl, true);
                          setIsLoadModalOpen(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold shrink-0"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {loadTab === 'gdrive' && (
                <div className="py-8 px-4 text-center space-y-3">
                  <img
                    src="/assets/icons/IcGoogleDriveDbot.svg"
                    alt="Google Drive"
                    className="w-12 h-12 mx-auto"
                  />
                  <div className="font-bold text-sm">Google Drive Strategy Sync</div>
                  {hasGoogleDriveCreds ? (
                    <p className="text-xs opacity-75 max-w-md mx-auto">
                      Google Drive credentials detected. Connect your Drive folder to pick XML bot files.
                    </p>
                  ) : (
                    <p className="text-xs opacity-75 max-w-md mx-auto leading-relaxed">
                      Google Drive integration is optional and remains disabled until{' '}
                      <code className="px-1 py-0.5 rounded bg-slate-500/15">VITE_GD_CLIENT_ID</code>,{' '}
                      <code className="px-1 py-0.5 rounded bg-slate-500/15">VITE_GD_APP_ID</code>, and{' '}
                      <code className="px-1 py-0.5 rounded bg-slate-500/15">VITE_GD_API_KEY</code> are configured in your host environment. Use <strong>Local (.xml)</strong> to import or export strategies directly.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. SAVE STRATEGY MODAL
         ===================================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#262b33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-[#00a79e]" />
                <h3 className="font-bold text-sm">Save Strategy</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded hover:bg-slate-200/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1.5">Bot name</label>
                <input
                  type="text"
                  value={botNameInput}
                  onChange={e => setBotNameInput(e.target.value)}
                  placeholder="Enter strategy name..."
                  className={`w-full px-3 py-2 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-[#00a79e] ${
                    isDark
                      ? 'bg-[#111417] border-[#2d333b] text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                  isDark ? 'bg-[#121519] border-[#262b33]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-[#00a79e]" />
                  <div>
                    <div className="font-bold">Also download .xml to My Computer</div>
                    <div className="text-[11px] opacity-65">
                      Compatible with Deriv Bot & HopeLogic
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={downloadAsXml}
                  onChange={e => setDownloadAsXml(e.target.checked)}
                  className="w-4 h-4 accent-[#00a79e]"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white font-bold"
                >
                  Save Strategy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. TRANSACTION DETAILS MODAL (Spot-by-Spot Contract Audit)
         ===================================================================== */}
      {selectedContractDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#262b33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedContractDetail.status === 'won' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : selectedContractDetail.status === 'lost' ? (
                  <XCircle className="w-5 h-5 text-[#ff444f]" />
                ) : (
                  <Clock className="w-5 h-5 text-sky-400" />
                )}
                <div>
                  <h3 className="font-bold text-sm">Transaction Details</h3>
                  <div className="text-[11px] font-mono opacity-65">
                    Ref ID: {selectedContractDetail.referenceId}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContractDetail(null)}
                className="p-1 rounded hover:bg-slate-200/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const c = selectedContractDetail;
              const sym =
                MARKET_SYMBOLS.find(m => m.symbol === c.symbol) || MARKET_SYMBOLS[0];
              const quotes = c.spotTrail.map(s => s.quote);
              const minQ = Math.min(...quotes, c.entrySpot);
              const maxQ = Math.max(...quotes, c.entrySpot);
              const span = Math.max(1e-6, maxQ - minQ);

              return (
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="opacity-60 text-[11px]">Market</div>
                      <div className="font-bold">{c.symbolName}</div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Contract Type</div>
                      <div className="font-bold">{c.contractLabel}</div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Status</div>
                      <div
                        className={`font-bold uppercase ${
                          c.status === 'won'
                            ? 'text-emerald-500'
                            : c.status === 'lost'
                            ? 'text-[#ff444f]'
                            : 'text-sky-400'
                        }`}
                      >
                        {c.status}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Entry Spot</div>
                      <div className="font-mono font-semibold">
                        {c.entrySpot.toFixed(sym.pipSize)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">
                        {c.status === 'open' ? 'Current Spot' : 'Exit Spot'}
                      </div>
                      <div className="font-mono font-semibold">
                        {(c.exitSpot ?? c.currentSpot).toFixed(sym.pipSize)}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Duration</div>
                      <div className="font-mono font-semibold">
                        {c.elapsedTicks} / {c.durationTicks} ticks
                      </div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Buy Price</div>
                      <div className="font-mono font-semibold">
                        {c.buyPrice.toFixed(2)} {c.currency}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Payout</div>
                      <div className="font-mono font-semibold">
                        {c.payout.toFixed(2)} {c.currency}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Profit / Loss</div>
                      <div
                        className={`font-mono font-bold ${
                          c.profit >= 0 ? 'text-emerald-500' : 'text-[#ff444f]'
                        }`}
                      >
                        {c.profit >= 0 ? '+' : ''}
                        {c.profit.toFixed(2)} {c.currency}
                      </div>
                    </div>
                  </div>

                  {/* Mini Trajectory Sparkline */}
                  {c.spotTrail.length > 1 && (
                    <div
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-[#111418] border-[#262b33]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-semibold mb-2 opacity-75">
                        Tick-by-Tick Spot Trajectory
                      </div>
                      <svg viewBox="0 0 360 90" className="w-full h-24">
                        <line
                          x1="10"
                          y1={80 - ((c.entrySpot - minQ) / span) * 65}
                          x2="350"
                          y2={80 - ((c.entrySpot - minQ) / span) * 65}
                          stroke="#94a3b8"
                          strokeDasharray="3 3"
                        />
                        <polyline
                          fill="none"
                          stroke={c.profit >= 0 ? '#10b981' : '#ff444f'}
                          strokeWidth="2.2"
                          points={c.spotTrail
                            .map((pt, idx) => {
                              const x =
                                10 + (idx / Math.max(1, c.spotTrail.length - 1)) * 340;
                              const y = 80 - ((pt.quote - minQ) / span) * 65;
                              return `${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ')}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};
