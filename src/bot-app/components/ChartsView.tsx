import React, { useMemo, useState } from 'react';
import { Activity, BarChart2, CandlestickChart, LineChart, Layers } from 'lucide-react';
import { useBot } from '../context/BotContext';
import { MARKET_SYMBOLS } from '../constants/markets-and-strategies';
import {
  computeBollingerBands,
  computeEMA,
  computeLastDigitDistribution,
  computeRSI,
  computeSMA,
} from '../services/deriv-ws.service';

export const ChartsView: React.FC = () => {
  const {
    isDark,
    activeSymbol,
    setActiveSymbol,
    chartGranularity,
    setChartGranularity,
    ticks,
    candles,
    openContract,
  } = useBot();

  const [chartType, setChartType] = useState<'area' | 'candles'>('candles');
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showDigitsPanel, setShowDigitsPanel] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const symMeta = MARKET_SYMBOLS.find(m => m.symbol === activeSymbol) || MARKET_SYMBOLS[0];

  const lastTick = ticks[ticks.length - 1];
  const firstTick = ticks[0];
  const sessionDelta = lastTick && firstTick ? lastTick.quote - firstTick.quote : 0;
  const sessionPct =
    lastTick && firstTick && firstTick.quote > 0
      ? (sessionDelta / firstTick.quote) * 100
      : 0;

  const digitDist = useMemo(() => computeLastDigitDistribution(ticks), [ticks]);

  // Prepare visual series (up to 70 points/bars)
  const displayCandles = useMemo(() => candles.slice(-60), [candles]);
  const displayTicks = useMemo(() => ticks.slice(-80), [ticks]);

  const seriesPrices = useMemo(
    () =>
      chartType === 'candles' && displayCandles.length > 5
        ? displayCandles.map(c => c.close)
        : displayTicks.map(t => t.quote),
    [chartType, displayCandles, displayTicks]
  );

  const smaLine = useMemo(() => computeSMA(seriesPrices, 14), [seriesPrices]);
  const emaLine = useMemo(() => computeEMA(seriesPrices, 9), [seriesPrices]);
  const bbBands = useMemo(() => computeBollingerBands(seriesPrices, 14, 2), [seriesPrices]);
  const rsiSeries = useMemo(() => computeRSI(seriesPrices, 14), [seriesPrices]);

  // SVG Coordinate System
  const width = 920;
  const mainHeight = showRSI ? 310 : 410;
  const totalHeight = 430;
  const padLeft = 16;
  const padRight = 76;
  const padTop = 18;
  const padBottom = 22;
  const plotW = width - padLeft - padRight;
  const plotH = mainHeight - padTop - padBottom;

  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    if (chartType === 'candles' && displayCandles.length > 5) {
      for (const c of displayCandles) {
        if (c.low < min) min = c.low;
        if (c.high > max) max = c.high;
      }
    } else {
      for (const t of displayTicks) {
        if (t.quote < min) min = t.quote;
        if (t.quote > max) max = t.quote;
      }
    }
    if (showBB) {
      for (const u of bbBands.upper) if (u !== null && u > max) max = u;
      for (const l of bbBands.lower) if (l !== null && l < min) min = l;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      min = symMeta.basePrice * 0.998;
      max = symMeta.basePrice * 1.002;
    }
    if (max === min) {
      max += symMeta.volatility || 1;
      min -= symMeta.volatility || 1;
    }
    const pad = (max - min) * 0.08;
    return { minPrice: min - pad, maxPrice: max + pad };
  }, [bbBands, chartType, displayCandles, displayTicks, showBB, symMeta]);

  const yForPrice = (p: number) =>
    padTop + ((maxPrice - p) / Math.max(1e-9, maxPrice - minPrice)) * plotH;

  const count =
    chartType === 'candles' && displayCandles.length > 5
      ? displayCandles.length
      : displayTicks.length;

  const xForIdx = (i: number) =>
    padLeft + (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW);

  const buildPath = (arr: (number | null)[]) => {
    let d = '';
    arr.forEach((v, idx) => {
      if (v === null) return;
      const x = xForIdx(idx).toFixed(1);
      const y = yForPrice(v).toFixed(1);
      d += d === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return d;
  };

  const priceTicks = useMemo(() => {
    const steps = 5;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) {
      out.push(minPrice + ((maxPrice - minPrice) * i) / steps);
    }
    return out;
  }, [maxPrice, minPrice]);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-3 sm:p-5 gap-4">
      {/* Top Chart Controls Bar */}
      <div
        className={`rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-[#181b1f] border-[#292f36]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Symbol Dropdown & Live Quote */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeSymbol}
            onChange={e => setActiveSymbol(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#00a79e] ${
              isDark
                ? 'bg-[#111417] border-[#2d333b] text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            {MARKET_SYMBOLS.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.displayName} ({s.shortCode})
              </option>
            ))}
          </select>

          {lastTick && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold font-mono">
                {lastTick.quote.toFixed(symMeta.pipSize)}
              </span>
              <span
                className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                  sessionDelta >= 0
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {sessionDelta >= 0 ? '+' : ''}
                {sessionDelta.toFixed(symMeta.pipSize)} ({sessionPct >= 0 ? '+' : ''}
                {sessionPct.toFixed(2)}%)
              </span>
              <span className="text-xs font-mono opacity-65">
                Last Digit: <strong className="text-[#00a79e]">{lastTick.lastDigit}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Chart Mode, Granularity & Indicator Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex rounded-lg border p-0.5 ${
              isDark ? 'border-[#2d333b] bg-[#111417]' : 'border-slate-200 bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setChartType('candles')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                chartType === 'candles'
                  ? 'bg-[#00a79e] text-white'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                chartType === 'area'
                  ? 'bg-[#00a79e] text-white'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Ticks</span>
            </button>
          </div>

          {chartType === 'candles' && (
            <div
              className={`inline-flex rounded-lg border p-0.5 text-xs ${
                isDark ? 'border-[#2d333b] bg-[#111417]' : 'border-slate-200 bg-slate-100'
              }`}
            >
              {[
                { sec: 60, label: '1m' },
                { sec: 120, label: '2m' },
                { sec: 300, label: '5m' },
                { sec: 900, label: '15m' },
              ].map(tf => (
                <button
                  key={tf.sec}
                  type="button"
                  onClick={() => setChartGranularity(tf.sec)}
                  className={`px-2 py-1 rounded-md font-semibold ${
                    chartGranularity === tf.sec
                      ? isDark
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-900 shadow-2xs'
                      : 'opacity-65 hover:opacity-100'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}

          {/* Indicator Toggles */}
          <div className="flex items-center gap-1 text-xs">
            <Layers className="w-3.5 h-3.5 opacity-60 mr-0.5" />
            {[
              { label: 'SMA 14', active: showSMA, toggle: () => setShowSMA(v => !v), color: 'text-amber-500' },
              { label: 'EMA 9', active: showEMA, toggle: () => setShowEMA(v => !v), color: 'text-sky-400' },
              { label: 'BB', active: showBB, toggle: () => setShowBB(v => !v), color: 'text-purple-400' },
              { label: 'RSI 14', active: showRSI, toggle: () => setShowRSI(v => !v), color: 'text-emerald-400' },
              { label: 'Digits', active: showDigitsPanel, toggle: () => setShowDigitsPanel(v => !v), color: 'text-[#00a79e]' },
            ].map(ind => (
              <button
                key={ind.label}
                type="button"
                onClick={ind.toggle}
                className={`px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors ${
                  ind.active
                    ? isDark
                      ? `bg-slate-800 border-slate-600 ${ind.color}`
                      : 'bg-slate-900 border-slate-900 text-white'
                    : isDark
                    ? 'border-[#2d333b] opacity-60 hover:opacity-100'
                    : 'border-slate-200 opacity-65 hover:opacity-100'
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Price & Indicator Chart */}
      <div
        className={`flex-1 min-h-[340px] rounded-xl border p-3 flex flex-col justify-between relative overflow-hidden ${
          isDark ? 'bg-[#121519] border-[#292f36]' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-full select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={e => {
            if (count <= 1) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            const ratio = Math.max(0, Math.min(1, (relX - padLeft) / plotW));
            setHoverIndex(Math.round(ratio * (count - 1)));
          }}
        >
          {/* Horizontal Price Grid Lines */}
          {priceTicks.map((pt, i) => {
            const y = yForPrice(pt);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isDark ? '#222831' : '#e2e8f0'}
                  strokeDasharray="3 3"
                />
                <text
                  x={width - padRight + 6}
                  y={y + 3.5}
                  fontSize="10"
                  fill={isDark ? '#94a3b8' : '#64748b'}
                  className="font-mono"
                >
                  {pt.toFixed(symMeta.pipSize)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands */}
          {showBB && count > 1 && (
            <>
              <path
                d={buildPath(bbBands.upper)}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.75"
              />
              <path
                d={buildPath(bbBands.lower)}
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.75"
              />
            </>
          )}

          {/*Candlesticks OR Tick Area Line */}
          {chartType === 'candles' && displayCandles.length > 5 ? (
            displayCandles.map((c, idx) => {
              const x = xForIdx(idx);
              const isBull = c.close >= c.open;
              const color = isBull ? '#10b981' : '#ff444f';
              const yOpen = yForPrice(c.open);
              const yClose = yForPrice(c.close);
              const yHigh = yForPrice(c.high);
              const yLow = yForPrice(c.low);
              const barTop = Math.min(yOpen, yClose);
              const barHeight = Math.max(2, Math.abs(yClose - yOpen));
              const candleW = Math.max(3, Math.min(10, (plotW / displayCandles.length) * 0.62));

              return (
                <g key={c.epoch + '-' + idx}>
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.3" />
                  <rect
                    x={x - candleW / 2}
                    y={barTop}
                    width={candleW}
                    height={barHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          ) : displayTicks.length > 1 ? (
            <>
              <defs>
                <linearGradient id="tickAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00a79e" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#00a79e" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${buildPath(displayTicks.map(t => t.quote))} L ${xForIdx(
                  displayTicks.length - 1
                )} ${mainHeight - padBottom} L ${xForIdx(0)} ${mainHeight - padBottom} Z`}
                fill="url(#tickAreaGrad)"
              />
              <path
                d={buildPath(displayTicks.map(t => t.quote))}
                fill="none"
                stroke="#00a79e"
                strokeWidth="2"
              />
            </>
          ) : null}

          {/* SMA & EMA Overlays */}
          {showSMA && count > 1 && (
            <path d={buildPath(smaLine)} fill="none" stroke="#f59e0b" strokeWidth="1.6" />
          )}
          {showEMA && count > 1 && (
            <path d={buildPath(emaLine)} fill="none" stroke="#38bdf8" strokeWidth="1.6" />
          )}

          {/* Open Contract Entry Spot Line */}
          {openContract && openContract.symbol === activeSymbol && (
            <g>
              <line
                x1={padLeft}
                y1={yForPrice(openContract.entrySpot)}
                x2={width - padRight}
                y2={yForPrice(openContract.entrySpot)}
                stroke="#3bf75a"
                strokeWidth="1.6"
                strokeDasharray="6 3"
              />
              <rect
                x={padLeft + 6}
                y={yForPrice(openContract.entrySpot) - 10}
                width={122}
                height={18}
                rx={4}
                fill="#10b981"
              />
              <text
                x={padLeft + 12}
                y={yForPrice(openContract.entrySpot) + 2}
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
              >
                Entry: {openContract.entrySpot.toFixed(symMeta.pipSize)}
              </text>
            </g>
          )}

          {/* Live Current Price Horizontal Marker */}
          {lastTick && (
            <g>
              <line
                x1={padLeft}
                y1={yForPrice(lastTick.quote)}
                x2={width - padRight}
                y2={yForPrice(lastTick.quote)}
                stroke="#00a79e"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={width - padRight + 2}
                y={yForPrice(lastTick.quote) - 9}
                width={70}
                height={18}
                rx={4}
                fill="#00a79e"
              />
              <text
                x={width - padRight + 7}
                y={yForPrice(lastTick.quote) + 3.5}
                fontSize="10"
                fontWeight="bold"
                fill="#ffffff"
                className="font-mono"
              >
                {lastTick.quote.toFixed(symMeta.pipSize)}
              </text>
            </g>
          )}

          {/* RSI(14) Subplot */}
          {showRSI && (
            <g>
              <line
                x1={padLeft}
                y1={mainHeight + 6}
                x2={width - padRight}
                y2={mainHeight + 6}
                stroke={isDark ? '#2a313c' : '#cbd5e1'}
              />
              <text
                x={padLeft + 4}
                y={mainHeight + 20}
                fontSize="10"
                fontWeight="bold"
                fill={isDark ? '#94a3b8' : '#64748b'}
              >
                RSI (14)
              </text>
              {/* 70 Overbought & 30 Oversold guides */}
              {[70, 30].map(lvl => {
                const rsiTop = mainHeight + 16;
                const rsiH = totalHeight - rsiTop - 10;
                const ry = rsiTop + ((100 - lvl) / 100) * rsiH;
                return (
                  <g key={lvl}>
                    <line
                      x1={padLeft}
                      y1={ry}
                      x2={width - padRight}
                      y2={ry}
                      stroke={lvl === 70 ? '#ff444f' : '#10b981'}
                      strokeOpacity="0.4"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={width - padRight + 6}
                      y={ry + 3}
                      fontSize="9"
                      fill={isDark ? '#94a3b8' : '#64748b'}
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}
              {/* RSI Curve */}
              <path
                d={(() => {
                  const rsiTop = mainHeight + 16;
                  const rsiH = totalHeight - rsiTop - 10;
                  let d = '';
                  rsiSeries.forEach((val, idx) => {
                    if (val === null) return;
                    const x = xForIdx(idx).toFixed(1);
                    const y = (rsiTop + ((100 - val) / 100) * rsiH).toFixed(1);
                    d += d === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
                  });
                  return d;
                })()}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && hoverIndex < count && (
            <line
              x1={xForIdx(hoverIndex)}
              y1={padTop}
              x2={xForIdx(hoverIndex)}
              y2={totalHeight - 10}
              stroke={isDark ? '#64748b' : '#94a3b8'}
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Legend Overlay */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-[11px] opacity-75">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[#00a79e]" />
              Live Deriv Stream ({symMeta.symbol})
            </span>
            {showSMA && <span className="text-amber-500 font-semibold">● SMA(14)</span>}
            {showEMA && <span className="text-sky-400 font-semibold">● EMA(9)</span>}
            {showBB && <span className="text-purple-400 font-semibold">● Bollinger(14, 2σ)</span>}
          </div>
          {hoverIndex !== null && seriesPrices[hoverIndex] !== undefined && (
            <span className="font-mono font-semibold">
              Inspect Quote: {seriesPrices[hoverIndex].toFixed(symMeta.pipSize)}
            </span>
          )}
        </div>
      </div>

      {/* Last Digit Distribution (0–9) Live Analytics Bar */}
      {showDigitsPanel && (
        <div
          className={`rounded-xl border p-3.5 ${
            isDark ? 'bg-[#181b1f] border-[#292f36]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#00a79e]" />
              <span className="font-bold text-xs">
                Last Digit Distribution (Last {Math.min(100, ticks.length)} Ticks)
              </span>
            </div>
            <span className="text-[11px] opacity-65">
              Highlighted digit = latest incoming tick
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {digitDist.map((pct, digit) => {
              const isLatest = lastTick?.lastDigit === digit;
              const maxPct = Math.max(...digitDist, 10);
              const isHighest = pct === maxPct && pct > 0;
              return (
                <div
                  key={digit}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isLatest
                      ? 'border-[#3bf75a] bg-[#3bf75a]/10 ring-1 ring-[#3bf75a]'
                      : isDark
                      ? 'bg-[#111418] border-[#262b33]'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">Digit {digit}</div>
                  <div className="h-12 flex items-end justify-center my-1.5">
                    <div
                      style={{ height: `${Math.max(8, Math.min(100, pct * 4.2))}%` }}
                      className={`w-5 rounded-t transition-all ${
                        isLatest
                          ? 'bg-[#3bf75a]'
                          : isHighest
                          ? 'bg-[#00a79e]'
                          : 'bg-slate-400/55 dark:bg-slate-600'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] font-mono opacity-80">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
