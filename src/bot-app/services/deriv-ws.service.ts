import { CandleBar, MarketSymbol, TickPoint } from '../types/bot.types';
import { MARKET_SYMBOLS } from '../constants/markets-and-strategies';

type ConnectionState = 'connecting' | 'connected' | 'fallback';

interface DerivWSCallbacks {
  onTicksSnapshot: (ticks: TickPoint[]) => void;
  onTick: (tick: TickPoint) => void;
  onCandlesSnapshot: (candles: CandleBar[]) => void;
  onCandleUpdate: (candle: CandleBar) => void;
  onServerTime: (epochSeconds: number, latencyMs: number) => void;
  onConnectionChange: (state: ConnectionState) => void;
  onAuthResult?: (result: {
    ok: boolean;
    loginid?: string;
    currency?: string;
    balance?: number;
    isVirtual?: boolean;
    error?: string;
  }) => void;
}

export class DerivMarketStreamService {
  private ws: WebSocket | null = null;
  private currentSymbol: string = '1HZ100V';
  private granularity: number = 60;
  private callbacks: DerivWSCallbacks | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPingSentAt: number = 0;
  private isDisposed = false;
  private pipSize = 2;

  private getAppId(): string {
    const envId = import.meta.env.VITE_DERIV_APP_ID?.trim();
    return envId && /^\d+$/.test(envId) ? envId : '1089';
  }

  public connect(symbol: string, granularity: number, callbacks: DerivWSCallbacks): void {
    this.isDisposed = false;
    this.currentSymbol = symbol;
    this.granularity = granularity;
    this.callbacks = callbacks;

    const meta = MARKET_SYMBOLS.find(m => m.symbol === symbol);
    this.pipSize = meta?.pipSize ?? 2;

    this.cleanupTimers();
    this.closeSocket();

    callbacks.onConnectionChange('connecting');

    try {
      const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.getAppId()}`;
      const socket = new WebSocket(wsUrl);
      this.ws = socket;

      const connectGuard = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN && !this.isDisposed) {
          this.startLocalStreamFallback(meta || MARKET_SYMBOLS[0]);
        }
      }, 6500);

      socket.onopen = () => {
        clearTimeout(connectGuard);
        if (this.isDisposed) return;
        this.stopFallback();
        this.callbacks?.onConnectionChange('connected');
        this.subscribeMarket(this.currentSymbol, this.granularity);
        this.sendTimePing();
        this.pingTimer = setInterval(() => this.sendTimePing(), 10000);
      };

      socket.onmessage = event => {
        if (this.isDisposed) return;
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {
          // Ignore malformed frame
        }
      };

      socket.onerror = () => {
        clearTimeout(connectGuard);
        if (!this.isDisposed && !this.fallbackTimer) {
          this.startLocalStreamFallback(meta || MARKET_SYMBOLS[0]);
        }
      };

      socket.onclose = () => {
        clearTimeout(connectGuard);
        if (this.isDisposed) return;
        if (!this.fallbackTimer) {
          this.startLocalStreamFallback(meta || MARKET_SYMBOLS[0]);
        }
        this.reconnectTimer = setTimeout(() => {
          if (!this.isDisposed && this.callbacks) {
            this.connect(this.currentSymbol, this.granularity, this.callbacks);
          }
        }, 15000);
      };
    } catch {
      this.startLocalStreamFallback(meta || MARKET_SYMBOLS[0]);
    }
  }

  public switchSymbol(symbol: string, granularity: number): void {
    this.currentSymbol = symbol;
    this.granularity = granularity;
    const meta = MARKET_SYMBOLS.find(m => m.symbol === symbol);
    this.pipSize = meta?.pipSize ?? 2;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ forget_all: ['ticks', 'candles'] }));
      this.subscribeMarket(symbol, granularity);
    } else {
      this.startLocalStreamFallback(meta || MARKET_SYMBOLS[0]);
    }
  }

  public authorizeWithToken(apiToken: string): void {
    if (!apiToken.trim()) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ authorize: apiToken.trim() }));
    } else {
      this.callbacks?.onAuthResult?.({
        ok: false,
        error: 'Live WebSocket is currently reconnecting. Please try again in a moment.',
      });
    }
  }

  private subscribeMarket(symbol: string, granularity: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // 1. Subscribe to live ticks + last 120 ticks
    this.ws.send(
      JSON.stringify({
        ticks_history: symbol,
        adjust_start_time: 1,
        count: 120,
        end: 'latest',
        start: 1,
        style: 'ticks',
        subscribe: 1,
      })
    );

    // 2. Subscribe to OHLC candles
    this.ws.send(
      JSON.stringify({
        ticks_history: symbol,
        adjust_start_time: 1,
        count: 80,
        end: 'latest',
        granularity: granularity || 60,
        start: 1,
        style: 'candles',
        subscribe: 1,
      })
    );
  }

  private sendTimePing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.lastPingSentAt = performance.now();
      this.ws.send(JSON.stringify({ time: 1 }));
    }
  }

  private extractLastDigit(quote: number, pipSize: number): number {
    const formatted = quote.toFixed(pipSize);
    const ch = formatted[formatted.length - 1];
    const d = parseInt(ch, 10);
    return Number.isNaN(d) ? 0 : d;
  }

  private handleMessage(data: Record<string, any>): void {
    if (data.msg_type === 'time' && typeof data.time === 'number') {
      const rtt = this.lastPingSentAt > 0 ? Math.round(performance.now() - this.lastPingSentAt) : 42;
      this.callbacks?.onServerTime(data.time, Math.max(12, rtt));
      return;
    }

    if (data.msg_type === 'authorize') {
      if (data.error) {
        this.callbacks?.onAuthResult?.({
          ok: false,
          error: data.error.message || 'Authorization failed for token.',
        });
      } else if (data.authorize) {
        this.callbacks?.onAuthResult?.({
          ok: true,
          loginid: data.authorize.loginid,
          currency: data.authorize.currency || 'USD',
          balance: Number(data.authorize.balance ?? 0),
          isVirtual: Boolean(data.authorize.is_virtual),
        });
      }
      return;
    }

    if (data.error) {
      return;
    }

    if (data.msg_type === 'history' && data.history?.prices && data.history?.times) {
      const prices: number[] = data.history.prices.map(Number);
      const times: number[] = data.history.times.map(Number);
      if (typeof data.pip_size === 'number') {
        this.pipSize = data.pip_size;
      }
      const ticks: TickPoint[] = prices.map((q, idx) => ({
        epoch: times[idx] || Math.floor(Date.now() / 1000),
        quote: q,
        lastDigit: this.extractLastDigit(q, this.pipSize),
      }));
      this.callbacks?.onTicksSnapshot(ticks);
      return;
    }

    if (data.msg_type === 'tick' && data.tick) {
      if (typeof data.tick.pip_size === 'number') {
        this.pipSize = data.tick.pip_size;
      }
      const quote = Number(data.tick.quote);
      const epoch = Number(data.tick.epoch);
      this.callbacks?.onTick({
        epoch,
        quote,
        lastDigit: this.extractLastDigit(quote, this.pipSize),
      });
      return;
    }

    if (data.msg_type === 'candles' && Array.isArray(data.candles)) {
      const candles: CandleBar[] = data.candles.map((c: any) => ({
        epoch: Number(c.epoch),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }));
      this.callbacks?.onCandlesSnapshot(candles);
      return;
    }

    if (data.msg_type === 'ohlc' && data.ohlc) {
      const c = data.ohlc;
      this.callbacks?.onCandleUpdate({
        epoch: Number(c.open_time || c.epoch),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      });
    }
  }

  private startLocalStreamFallback(meta: MarketSymbol): void {
    this.stopFallback();
    this.callbacks?.onConnectionChange('fallback');

    const nowSec = Math.floor(Date.now() / 1000);
    let price = meta.basePrice;
    const pip = meta.pipSize;
    const vol = meta.volatility;

    const seedTicks: TickPoint[] = [];
    for (let i = 100; i >= 1; i--) {
      price = Number(Math.max(vol * 5, price + (Math.random() - 0.498) * vol).toFixed(pip));
      seedTicks.push({
        epoch: nowSec - i,
        quote: price,
        lastDigit: this.extractLastDigit(price, pip),
      });
    }
    this.callbacks?.onTicksSnapshot(seedTicks);

    const gran = this.granularity || 60;
    const seedCandles: CandleBar[] = [];
    let cPrice = meta.basePrice * 0.996;
    for (let i = 60; i >= 0; i--) {
      const open = Number(cPrice.toFixed(pip));
      const d1 = (Math.random() - 0.495) * vol * 3;
      const close = Number(Math.max(vol * 4, open + d1).toFixed(pip));
      const high = Number((Math.max(open, close) + Math.random() * vol * 1.6).toFixed(pip));
      const low = Number(Math.max(vol * 2, Math.min(open, close) - Math.random() * vol * 1.6).toFixed(pip));
      cPrice = close;
      seedCandles.push({
        epoch: Math.floor((nowSec - i * gran) / gran) * gran,
        open,
        high,
        low,
        close,
      });
    }
    this.callbacks?.onCandlesSnapshot(seedCandles);

    let activeCandle = { ...seedCandles[seedCandles.length - 1] };

    this.fallbackTimer = setInterval(() => {
      if (this.isDisposed) return;
      const ts = Math.floor(Date.now() / 1000);
      price = Number(Math.max(vol * 5, price + (Math.random() - 0.498) * vol).toFixed(pip));
      const tick: TickPoint = {
        epoch: ts,
        quote: price,
        lastDigit: this.extractLastDigit(price, pip),
      };
      this.callbacks?.onTick(tick);
      this.callbacks?.onServerTime(ts, 28);

      const bucket = Math.floor(ts / gran) * gran;
      if (bucket > activeCandle.epoch) {
        activeCandle = {
          epoch: bucket,
          open: price,
          high: price,
          low: price,
          close: price,
        };
      } else {
        activeCandle = {
          ...activeCandle,
          high: Math.max(activeCandle.high, price),
          low: Math.min(activeCandle.low, price),
          close: price,
        };
      }
      this.callbacks?.onCandleUpdate(activeCandle);
    }, 1000);
  }

  private stopFallback(): void {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private cleanupTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopFallback();
  }

  private closeSocket(): void {
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }
  }

  public disconnect(): void {
    this.isDisposed = true;
    this.cleanupTimers();
    this.closeSocket();
  }
}

// ============================================================================
// Technical Indicator Math Utilities (SMA, EMA, RSI, Bollinger Bands, Digits)
// ============================================================================

export function computeSMA(values: number[], period: number): (number | null)[] {
  if (period <= 1) return values.slice();
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function computeEMA(values: number[], period: number): (number | null)[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let ema = values[0];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      ema = values[0];
    } else {
      ema = values[i] * k + ema * (1 - k);
    }
    out.push(i >= Math.min(period - 1, 2) ? ema : null);
  }
  return out;
}

export function computeRSI(values: number[], period = 14): (number | null)[] {
  if (values.length < period + 1) return values.map(() => null);
  const out: (number | null)[] = new Array(values.length).fill(null);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = 1 + period; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}

export function computeBollingerBands(
  values: number[],
  period = 20,
  stdDevMult = 2
): { middle: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const middle = computeSMA(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    const m = middle[i];
    if (m === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j] - m;
      varianceSum += diff * diff;
    }
    const sd = Math.sqrt(varianceSum / period);
    upper.push(m + stdDevMult * sd);
    lower.push(m - stdDevMult * sd);
  }

  return { middle, upper, lower };
}

export function computeLastDigitDistribution(ticks: TickPoint[]): number[] {
  const counts = new Array(10).fill(0);
  if (ticks.length === 0) return counts;
  const recent = ticks.slice(-100);
  for (const t of recent) {
    if (t.lastDigit >= 0 && t.lastDigit <= 9) {
      counts[t.lastDigit]++;
    }
  }
  return counts.map(c => Number(((c / recent.length) * 100).toFixed(1)));
}
