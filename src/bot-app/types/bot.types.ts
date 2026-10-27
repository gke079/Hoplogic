export enum BotTab {
  DASHBOARD = 0,
  BOT_BUILDER = 1,
  CHART = 2,
  TUTORIAL = 3,
  BOTS = 4,
}

export enum ContractStage {
  NOT_RUNNING = 0,
  STARTING = 1,
  PURCHASE_SENT = 2,
  PURCHASE_RECEIVED = 3,
  CONTRACT_CLOSED = 4,
  STOPPING = 5,
  PAUSED = 6,
}

export type BotExecutionMode = 'normal' | 'fast';

export enum RunPanelTab {
  SUMMARY = 0,
  TRANSACTIONS = 1,
  JOURNAL = 2,
}

export type MarketCategory =
  | 'derived_volatility'
  | 'crash_boom'
  | 'jump_indices'
  | 'forex'
  | 'crypto';

export interface MarketSymbol {
  symbol: string;
  displayName: string;
  shortCode: string;
  market: MarketCategory;
  marketLabel: string;
  pipSize: number;
  basePrice: number;
  volatility: number;
}

export interface TickPoint {
  epoch: number;
  quote: number;
  lastDigit: number;
}

export interface CandleBar {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type TradeTypeGroup =
  | 'ups_downs'
  | 'digits_over_under'
  | 'digits_even_odd'
  | 'digits_match_diff'
  | 'accumulators';

export type ContractDirection =
  | 'CALL'
  | 'PUT'
  | 'ALTERNATE'
  | 'DIGITOVER'
  | 'DIGITUNDER'
  | 'DIGITEVEN'
  | 'DIGITODD'
  | 'DIGITMATCH'
  | 'DIGITDIFF'
  | 'ACCU';

export type PurchaseConditionType =
  | 'every_tick'
  | 'sma_cross'
  | 'rsi_threshold'
  | 'bollinger_breakout'
  | 'last_digit_streak'
  | 'candle_color';

export type QuickStrategyId =
  | 'MARTINGALE'
  | 'D_ALEMBERT'
  | 'OSCARS_GRIND'
  | 'REVERSE_MARTINGALE'
  | 'REVERSE_D_ALEMBERT'
  | 'STRATEGY_1_3_2_6';

export type StrategySystemType = QuickStrategyId | 'CUSTOM_FLAT';

export interface CustomVariable {
  id: string;
  name: string;
  value: number;
}

export interface BotStrategyConfig {
  id: string;
  name: string;
  saveType: 'local' | 'unsaved' | 'quick_strategy' | 'sample';
  updatedAt: number;
  description?: string;
  isFavorite?: boolean;
  categoryTag?: string;

  // Block 1: Trade parameters
  market: MarketCategory;
  symbol: string;
  tradeType: TradeTypeGroup;
  contractDirection: ContractDirection;
  candleInterval: number; // seconds: 60, 120, 300, 900, 3600
  duration: number;
  durationUnit: 't' | 's' | 'm';
  initialStake: number;
  prediction: number; // 0-9 for digit over/under/match/diff
  growthRate: number; // 0.01 to 0.05 for accumulators

  // Block 2: Purchase conditions
  conditionType: PurchaseConditionType;
  fastPeriod: number;
  slowPeriod: number;
  rsiPeriod: number;
  rsiThreshold: number;
  digitStreakCount: number;
  digitStreakTarget: 'even' | 'odd' | 'over5' | 'under5';

  // Block 3: Sell conditions (optional)
  enableSellConditions: boolean;
  sellTakeProfitPct: number;
  sellStopLossPct: number;

  // Block 4: Restart trading conditions & money management
  strategySystem: StrategySystemType;
  sizeMultiplier: number; // e.g., 2 for Martingale
  unitAmount: number; // e.g., 1 for D'Alembert / Oscar's Grind
  maxStakeEnabled: boolean;
  maxStake: number;
  takeProfit: number;
  stopLoss: number;
  restartOnError: boolean;
  cooldownTicks: number;

  // Custom workspace variables & notifications
  notifyOnTrade: boolean;
  variables: CustomVariable[];
}

export interface QuickStrategyMeta {
  id: QuickStrategyId;
  label: string;
  tagline: string;
  description: string[];
  formulaSummary: string;
  riskLevel: 'Moderate' | 'High' | 'Controlled';
  diagramUrl: string;
  defaultMultiplier: number;
  defaultUnit: number;
}

export interface ContractRecord {
  id: string;
  referenceId: string;
  symbol: string;
  symbolName: string;
  tradeType: TradeTypeGroup;
  contractType: Exclude<ContractDirection, 'ALTERNATE'>;
  contractLabel: string;
  currency: string;
  buyPrice: number;
  payout: number;
  profit: number;
  entrySpot: number;
  currentSpot: number;
  exitSpot?: number;
  barrier?: string;
  growthRate?: number;
  durationTicks: number;
  elapsedTicks: number;
  status: 'open' | 'won' | 'lost';
  startTime: number;
  endTime?: number;
  spotTrail: { epoch: number; quote: number }[];
}

export type JournalLogType = 'info' | 'success' | 'warn' | 'error' | 'notify';

export interface JournalEntry {
  id: string;
  timestamp: number;
  type: JournalLogType;
  message: string;
}

export interface AccountProfile {
  loginid: string;
  label: string;
  isDemo: boolean;
  currency: string;
  balance: number;
  isApiConnected?: boolean;
}

export interface RunStatistics {
  totalStake: number;
  totalPayout: number;
  numberOfRuns: number;
  lostContracts: number;
  wonContracts: number;
  totalProfit: number;
}

export type AutomationTriggerType =
  | 'manual'
  | 'scheduled_time'
  | 'timer_interval'
  | 'signal_match';

export interface BotAutomationRule {
  botId: string;
  enabled: boolean;
  triggerType: AutomationTriggerType;
  scheduledTime: string; // "HH:MM" 24h local time
  intervalMinutes: number; // e.g., 2, 5, 10, 15
  executionMode: BotExecutionMode;
  maxRunsPerSession: number; // 0 = unlimited until TP/SL
  chainNextBotId: string; // '' = none, otherwise ID of next stored bot to run after TP / maxRuns
  autoResetBeforeStart: boolean;
  lastTriggeredAt?: number;
  lastScheduledDate?: string; // "YYYY-MM-DD" to avoid duplicate daily time triggers
}

export interface BotLifetimeStats {
  botId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  netProfit: number;
  lastRunAt?: number;
}

