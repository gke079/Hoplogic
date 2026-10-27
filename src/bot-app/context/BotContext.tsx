import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccountProfile,
  BotAutomationRule,
  BotExecutionMode,
  BotLifetimeStats,
  BotStrategyConfig,
  BotTab,
  CandleBar,
  ContractDirection,
  ContractRecord,
  ContractStage,
  JournalEntry,
  JournalLogType,
  RunPanelTab,
  RunStatistics,
  TickPoint,
} from '../types/bot.types';
import {
  DEFAULT_STRATEGY,
  MARKET_SYMBOLS,
  parseDerivXmlToStrategy,
  SAMPLE_STRATEGIES,
  strategyToDerivXml,
  TRADE_TYPE_OPTIONS,
} from '../constants/markets-and-strategies';
import {
  computeBollingerBands,
  computeRSI,
  computeSMA,
  DerivMarketStreamService,
} from '../services/deriv-ws.service';

const STORAGE_STRATEGIES_KEY = 'hopelogic_saved_strategies_v1';
const STORAGE_THEME_KEY = 'hopelogic_theme_v1';
const STORAGE_ACCOUNTS_KEY = 'hopelogic_accounts_v1';
const STORAGE_EXEC_MODE_KEY = 'hopelogic_exec_mode_v1';
const STORAGE_AUTOMATIONS_KEY = 'hopelogic_bot_automations_v1';
const STORAGE_AUTOPILOT_KEY = 'hopelogic_autopilot_armed_v1';
const STORAGE_BOT_STATS_KEY = 'hopelogic_bot_lifetime_stats_v1';

const createDefaultAutomationRule = (botId: string): BotAutomationRule => ({
  botId,
  enabled: false,
  triggerType: 'manual',
  scheduledTime: '09:00',
  intervalMinutes: 5,
  executionMode: 'normal',
  maxRunsPerSession: 0,
  chainNextBotId: '',
  autoResetBeforeStart: false,
});

const INITIAL_ACCOUNTS: AccountProfile[] = [
  {
    loginid: 'VRTC9042185',
    label: 'Demo USD Account',
    isDemo: true,
    currency: 'USD',
    balance: 10000.0,
  },
  {
    loginid: 'VRTC9042186',
    label: 'Demo EUR Account',
    isDemo: true,
    currency: 'EUR',
    balance: 10000.0,
  },
  {
    loginid: 'VRTC9042189',
    label: 'Demo BTC Account',
    isDemo: true,
    currency: 'BTC',
    balance: 0.25,
  },
];

export interface ToastNotice {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface BotContextValue {
  // Navigation & Theme
  activeTab: BotTab;
  setActiveTab: (tab: BotTab) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;

  // Modals
  isQuickStrategyOpen: boolean;
  openQuickStrategy: (preselectId?: string) => void;
  closeQuickStrategy: () => void;
  preselectedQuickStrategy: string | null;
  isLoadModalOpen: boolean;
  setIsLoadModalOpen: (v: boolean) => void;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (v: boolean) => void;
  selectedContractDetail: ContractRecord | null;
  setSelectedContractDetail: (c: ContractRecord | null) => void;

  // Accounts & Auth
  accounts: AccountProfile[];
  activeAccount: AccountProfile;
  switchAccount: (loginid: string) => void;
  resetDemoBalance: () => void;
  connectDerivToken: (token: string) => void;
  authError: string | null;
  clearAuthError: () => void;

  // Market Stream
  activeSymbol: string;
  setActiveSymbol: (sym: string) => void;
  chartGranularity: number;
  setChartGranularity: (sec: number) => void;
  ticks: TickPoint[];
  candles: CandleBar[];
  connectionState: 'connecting' | 'connected' | 'fallback';
  serverTimeEpoch: number;
  latencyMs: number;

  // Strategy & Undo/Redo
  strategy: BotStrategyConfig;
  updateStrategy: (patch: Partial<BotStrategyConfig>, recordHistory?: boolean) => void;
  replaceStrategy: (next: BotStrategyConfig) => void;
  undoStrategy: () => void;
  redoStrategy: () => void;
  canUndo: boolean;
  canRedo: boolean;
  resetWorkspace: () => void;

  // Saved Strategies & Bot Vault CRUD
  savedStrategies: BotStrategyConfig[];
  saveCurrentStrategy: (customName: string, downloadXml: boolean) => void;
  createStoredBot: (bot: BotStrategyConfig) => void;
  updateSavedBot: (id: string, patch: Partial<BotStrategyConfig>) => void;
  toggleSavedBotFavorite: (id: string) => void;
  deleteSavedStrategy: (id: string) => void;
  duplicateSavedStrategy: (id: string) => void;
  loadStrategyIntoBuilder: (item: BotStrategyConfig, switchTab?: boolean) => void;
  downloadXmlForStrategy: (item: BotStrategyConfig) => void;
  importXmlContent: (xmlString: string, fileName: string, stayOnCurrentTab?: boolean) => void;

  // Bot Automation & Lifetime Stats
  automations: Record<string, BotAutomationRule>;
  getAutomationForBot: (botId: string) => BotAutomationRule;
  updateBotAutomation: (botId: string, patch: Partial<BotAutomationRule>) => void;
  isAutopilotArmed: boolean;
  setIsAutopilotArmed: (armed: boolean) => void;
  botLifetimeStats: Record<string, BotLifetimeStats>;
  resetBotLifetimeStats: (botId: string) => void;

  // Bot Execution & Run Panel
  isBotRunning: boolean;
  isBotPaused: boolean;
  executionMode: BotExecutionMode;
  setExecutionMode: (mode: BotExecutionMode) => void;
  contractStage: ContractStage;
  currentStake: number;
  activeExecutingBlock: 'trade_params' | 'purchase' | 'during' | 'restart' | null;
  startBot: (overrideStrategy?: BotStrategyConfig) => void;
  pauseBot: () => void;
  resumeBot: () => void;
  stopBot: (reason?: string) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  runPanelTab: RunPanelTab;
  setRunPanelTab: (tab: RunPanelTab) => void;
  openContract: ContractRecord | null;
  lastContract: ContractRecord | null;
  transactions: ContractRecord[];
  journal: JournalEntry[];
  statistics: RunStatistics;
  clearStatsAndLogs: () => void;

  // Notifications
  toasts: ToastNotice[];
  pushToast: (notice: Omit<ToastNotice, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const BotContext = createContext<BotContextValue | null>(null);

export const BotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return saved === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  // Sound
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const toggleSound = useCallback(() => setIsSoundEnabled(prev => !prev), []);

  const playSound = useCallback(
    (
      file:
        | 'coins.mp3'
        | 'job-done.mp3'
        | 'announcement.mp3'
        | 'out-of-bounds.mp3'
        | 'click.mp3'
        | 'delete.mp3'
    ) => {
      if (!isSoundEnabled) return;
      try {
        const audio = new Audio(`/assets/media/${file}`);
        audio.volume = 0.45;
        audio.play().catch(() => {});
      } catch {
        // Ignore audio autoplay block
      }
    },
    [isSoundEnabled]
  );

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<BotTab>(BotTab.DASHBOARD);
  const [isQuickStrategyOpen, setIsQuickStrategyOpen] = useState(false);
  const [preselectedQuickStrategy, setPreselectedQuickStrategy] = useState<string | null>(null);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [selectedContractDetail, setSelectedContractDetail] = useState<ContractRecord | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const pushToast = useCallback((notice: Omit<ToastNotice, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-2), { ...notice, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const openQuickStrategy = useCallback((preselectId?: string) => {
    setPreselectedQuickStrategy(preselectId || null);
    setIsQuickStrategyOpen(true);
  }, []);
  const closeQuickStrategy = useCallback(() => {
    setIsQuickStrategyOpen(false);
  }, []);

  // Accounts
  const [accounts, setAccounts] = useState<AccountProfile[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_ACCOUNTS;
  });
  const [activeLoginId, setActiveLoginId] = useState<string>(() => INITIAL_ACCOUNTS[0].loginid);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // Ignore quota
    }
  }, [accounts]);

  const activeAccount = useMemo(
    () => accounts.find(a => a.loginid === activeLoginId) || accounts[0],
    [accounts, activeLoginId]
  );

  // Strategy + Undo/Redo History
  const [strategy, setStrategy] = useState<BotStrategyConfig>(DEFAULT_STRATEGY);
  const [pastStrategies, setPastStrategies] = useState<BotStrategyConfig[]>([]);
  const [futureStrategies, setFutureStrategies] = useState<BotStrategyConfig[]>([]);

  // Saved Strategies
  const [savedStrategies, setSavedStrategies] = useState<BotStrategyConfig[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_STRATEGIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return SAMPLE_STRATEGIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STRATEGIES_KEY, JSON.stringify(savedStrategies));
    } catch {
      // Ignore quota
    }
  }, [savedStrategies]);

  // Bot Automation Rules & Lifetime Vault Stats
  const [automations, setAutomations] = useState<Record<string, BotAutomationRule>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_AUTOMATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore
    }
    return {};
  });

  const [isAutopilotArmed, setIsAutopilotArmedState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_AUTOPILOT_KEY) === 'true';
  });

  const [botLifetimeStats, setBotLifetimeStats] = useState<Record<string, BotLifetimeStats>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_BOT_STATS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Ignore
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTOMATIONS_KEY, JSON.stringify(automations));
    } catch {
      // Ignore
    }
  }, [automations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTOPILOT_KEY, isAutopilotArmed ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }, [isAutopilotArmed]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOT_STATS_KEY, JSON.stringify(botLifetimeStats));
    } catch {
      // Ignore
    }
  }, [botLifetimeStats]);

  // Market Stream State
  const [activeSymbol, setActiveSymbolState] = useState<string>(DEFAULT_STRATEGY.symbol);
  const [chartGranularity, setChartGranularityState] = useState<number>(60);
  const [ticks, setTicks] = useState<TickPoint[]>([]);
  const [candles, setCandles] = useState<CandleBar[]>([]);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'fallback'>('connecting');
  const [serverTimeEpoch, setServerTimeEpoch] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [latencyMs, setLatencyMs] = useState<number>(36);

  const streamServiceRef = useRef<DerivMarketStreamService | null>(null);

  // Bot Run Panel & Engine State
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [executionMode, setExecutionModeState] = useState<BotExecutionMode>(() => {
    const saved = localStorage.getItem(STORAGE_EXEC_MODE_KEY);
    return saved === 'fast' ? 'fast' : 'normal';
  });
  const [contractStage, setContractStage] = useState<ContractStage>(ContractStage.NOT_RUNNING);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [runPanelTab, setRunPanelTab] = useState<RunPanelTab>(RunPanelTab.SUMMARY);
  const [openContract, setOpenContract] = useState<ContractRecord | null>(null);
  const [lastContract, setLastContract] = useState<ContractRecord | null>(null);
  const [transactions, setTransactions] = useState<ContractRecord[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([
    {
      id: 'init-log',
      timestamp: Date.now(),
      type: 'info',
      message: 'HopeLogic Workspace initialized. Connected to live Deriv market feed.',
    },
  ]);
  const [currentStake, setCurrentStake] = useState<number>(DEFAULT_STRATEGY.initialStake);
  const [activeExecutingBlock, setActiveExecutingBlock] = useState<
    'trade_params' | 'purchase' | 'during' | 'restart' | null
  >(null);

  // Refs for synchronous access inside high-frequency WebSocket tick listener
  const isBotRunningRef = useRef(false);
  const isBotPausedRef = useRef(false);
  const executionModeRef = useRef<BotExecutionMode>(executionMode);
  const strategyRef = useRef<BotStrategyConfig>(strategy);
  const openContractRef = useRef<ContractRecord | null>(null);
  const currentStakeRef = useRef<number>(DEFAULT_STRATEGY.initialStake);
  const sessionNetProfitRef = useRef<number>(0);
  const sessionRunsCountRef = useRef<number>(0);
  const oscarsCycleProfitRef = useRef<number>(0);
  const sequenceStepRef = useRef<number>(0); // For 1-3-2-6
  const alternateNextDirRef = useRef<'CALL' | 'PUT'>('CALL');
  const cooldownRemainingRef = useRef<number>(0);
  const activeAccountRef = useRef<AccountProfile>(activeAccount);
  const candlesRef = useRef<CandleBar[]>([]);
  const ticksRef = useRef<TickPoint[]>([]);
  const activeSymbolRef = useRef<string>(activeSymbol);
  const savedStrategiesRef = useRef<BotStrategyConfig[]>(savedStrategies);
  const automationsRef = useRef<Record<string, BotAutomationRule>>(automations);
  const isAutopilotArmedRef = useRef<boolean>(isAutopilotArmed);

  useEffect(() => {
    savedStrategiesRef.current = savedStrategies;
  }, [savedStrategies]);

  useEffect(() => {
    automationsRef.current = automations;
  }, [automations]);

  useEffect(() => {
    isAutopilotArmedRef.current = isAutopilotArmed;
  }, [isAutopilotArmed]);

  useEffect(() => {
    executionModeRef.current = executionMode;
    try {
      localStorage.setItem(STORAGE_EXEC_MODE_KEY, executionMode);
    } catch {
      // Ignore storage quota
    }
  }, [executionMode]);

  useEffect(() => {
    strategyRef.current = strategy;
  }, [strategy]);

  useEffect(() => {
    activeAccountRef.current = activeAccount;
  }, [activeAccount]);

  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  useEffect(() => {
    ticksRef.current = ticks;
  }, [ticks]);

  useEffect(() => {
    activeSymbolRef.current = activeSymbol;
  }, [activeSymbol]);

  const appendJournal = useCallback((type: JournalLogType, message: string) => {
    setJournal(prev => [
      {
        id: `j-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        type,
        message,
      },
      ...prev.slice(0, 199),
    ]);
  }, []);

  const statistics: RunStatistics = useMemo(() => {
    let totalStake = 0;
    let totalPayout = 0;
    let wonContracts = 0;
    let lostContracts = 0;

    for (const tx of transactions) {
      if (tx.status === 'open') continue;
      totalStake += tx.buyPrice;
      totalPayout += tx.payout;
      if (tx.status === 'won') wonContracts++;
      else lostContracts++;
    }

    const totalProfit = Number((totalPayout - totalStake).toFixed(2));
    return {
      totalStake: Number(totalStake.toFixed(2)),
      totalPayout: Number(totalPayout.toFixed(2)),
      numberOfRuns: wonContracts + lostContracts,
      wonContracts,
      lostContracts,
      totalProfit,
    };
  }, [transactions]);

  // Adjust Account Balance Helper
  const adjustBalance = useCallback((loginid: string, delta: number) => {
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.loginid !== loginid) return acc;
        const decimals = acc.currency === 'BTC' ? 6 : 2;
        return {
          ...acc,
          balance: Math.max(0, Number((acc.balance + delta).toFixed(decimals))),
        };
      })
    );
  }, []);

  const stopBotInternal = useCallback(
    (reason?: string, logType: JournalLogType = 'warn') => {
      isBotRunningRef.current = false;
      isBotPausedRef.current = false;
      setIsBotRunning(false);
      setIsBotPaused(false);
      setContractStage(
        openContractRef.current || transactions.length > 0
          ? ContractStage.CONTRACT_CLOSED
          : ContractStage.NOT_RUNNING
      );
      setActiveExecutingBlock(null);
      if (reason) {
        appendJournal(logType, reason);
      }
    },
    [appendJournal, transactions.length]
  );

  // Compute Next Stake according to Quick Strategy Money Management
  const computeNextStake = useCallback((strat: BotStrategyConfig, didWin: boolean, prevStake: number, lastProfit: number): number => {
    const base = Math.max(0.35, strat.initialStake);
    let next = base;

    switch (strat.strategySystem) {
      case 'MARTINGALE': {
        next = didWin ? base : prevStake * Math.max(1.1, strat.sizeMultiplier);
        break;
      }
      case 'D_ALEMBERT': {
        const unitVal = strat.unitAmount * base;
        next = didWin ? Math.max(base, prevStake - unitVal) : prevStake + unitVal;
        break;
      }
      case 'OSCARS_GRIND': {
        oscarsCycleProfitRef.current += lastProfit;
        const unitVal = base;
        if (oscarsCycleProfitRef.current >= unitVal - 0.001) {
          oscarsCycleProfitRef.current = 0;
          next = base;
        } else if (didWin) {
          const neededToFinish = unitVal - oscarsCycleProfitRef.current + unitVal;
          next = Math.min(prevStake + unitVal, Math.max(base, neededToFinish));
        } else {
          next = prevStake;
        }
        break;
      }
      case 'REVERSE_MARTINGALE': {
        next = didWin ? prevStake * Math.max(1.1, strat.sizeMultiplier) : base;
        break;
      }
      case 'REVERSE_D_ALEMBERT': {
        const unitVal = strat.unitAmount * base;
        next = didWin ? prevStake + unitVal : Math.max(base, prevStake - unitVal);
        break;
      }
      case 'STRATEGY_1_3_2_6': {
        const seq = [1, 3, 2, 6];
        if (!didWin) {
          sequenceStepRef.current = 0;
        } else {
          sequenceStepRef.current = (sequenceStepRef.current + 1) % seq.length;
        }
        next = base * seq[sequenceStepRef.current];
        break;
      }
      case 'CUSTOM_FLAT':
      default:
        next = base;
        break;
    }

    if (strat.maxStakeEnabled && strat.maxStake > 0 && next > strat.maxStake) {
      next = base;
      appendJournal('warn', `Maximum stake cap (${strat.maxStake}) reached — stake reset to initial (${base}).`);
    }

    const decimals = activeAccountRef.current.currency === 'BTC' ? 5 : 2;
    return Number(Math.max(0.35, next).toFixed(decimals));
  }, [appendJournal]);

  // Evaluate Block 2 Purchase Conditions on live tick history
  const shouldTriggerPurchase = useCallback((strat: BotStrategyConfig, tickWindow: TickPoint[]): boolean => {
    if (tickWindow.length < 3) return false;
    const prices = tickWindow.map(t => t.quote);

    switch (strat.conditionType) {
      case 'every_tick':
        return true;

      case 'sma_cross': {
        const fast = computeSMA(prices, Math.max(2, strat.fastPeriod));
        const slow = computeSMA(prices, Math.max(3, strat.slowPeriod));
        const fNow = fast[fast.length - 1];
        const sNow = slow[slow.length - 1];
        if (fNow === null || sNow === null) return tickWindow.length >= strat.slowPeriod;
        return strat.contractDirection === 'PUT' ? fNow <= sNow : fNow >= sNow;
      }

      case 'rsi_threshold': {
        const rsi = computeRSI(prices, Math.max(3, strat.rsiPeriod));
        const rNow = rsi[rsi.length - 1];
        if (rNow === null) return false;
        return strat.contractDirection === 'PUT'
          ? rNow >= 100 - strat.rsiThreshold
          : rNow <= strat.rsiThreshold;
      }

      case 'bollinger_breakout': {
        const bb = computeBollingerBands(prices, 14, 1.8);
        const lastPrice = prices[prices.length - 1];
        const upper = bb.upper[bb.upper.length - 1];
        const lower = bb.lower[bb.lower.length - 1];
        if (upper === null || lower === null) return false;
        return strat.contractDirection === 'PUT' ? lastPrice >= upper : lastPrice <= lower;
      }

      case 'last_digit_streak': {
        const streakLen = Math.max(1, Math.min(6, strat.digitStreakCount));
        if (tickWindow.length < streakLen) return false;
        const slice = tickWindow.slice(-streakLen);
        return slice.every(t => {
          if (strat.digitStreakTarget === 'even') return t.lastDigit % 2 === 0;
          if (strat.digitStreakTarget === 'odd') return t.lastDigit % 2 !== 0;
          if (strat.digitStreakTarget === 'over5') return t.lastDigit > 5;
          return t.lastDigit < 5;
        });
      }

      case 'candle_color': {
        const cList = candlesRef.current;
        if (cList.length === 0) return true;
        const latest = cList[cList.length - 1];
        return strat.contractDirection === 'PUT'
          ? latest.close <= latest.open
          : latest.close >= latest.open;
      }

      default:
        return true;
    }
  }, []);

  // Process Every Live Tick through Bot Execution Engine
  const processEngineTick = useCallback(
    (latestTick: TickPoint, allTicks: TickPoint[]) => {
      const strat = strategyRef.current;
      const acct = activeAccountRef.current;

      // 1. Update open contract if one exists
      if (openContractRef.current) {
        const c = openContractRef.current;
        if (c.symbol !== strat.symbol) {
          // Symbol matches contract symbol
        }

        const nextElapsed = c.elapsedTicks + 1;
        const nextTrail = [...c.spotTrail, { epoch: latestTick.epoch, quote: latestTick.quote }];
        const symMeta = MARKET_SYMBOLS.find(m => m.symbol === c.symbol) || MARKET_SYMBOLS[0];

        // Check Accumulator knockout or unrealized profit
        let knockedOut = false;
        let unrealizedProfit = 0;

        if (c.contractType === 'ACCU') {
          const prevSpot = c.spotTrail[c.spotTrail.length - 1]?.quote ?? c.entrySpot;
          const moveRatio = Math.abs(latestTick.quote - prevSpot) / Math.max(0.0001, prevSpot);
          // Knockout range tighter at higher growth rates
          const maxMoveAllowed = (symMeta.volatility / symMeta.basePrice) * (2.6 - (c.growthRate || 0.03) * 18);
          if (moveRatio > Math.max(0.00035, maxMoveAllowed)) {
            knockedOut = true;
          } else {
            const grownPayout = c.buyPrice * Math.pow(1 + (c.growthRate || 0.03), nextElapsed);
            unrealizedProfit = Number((grownPayout - c.buyPrice).toFixed(2));
          }
        } else {
          // Estimate live indicative profit
          const mult =
            TRADE_TYPE_OPTIONS.flatMap(g => g.directions).find(d => d.value === c.contractType)
              ?.payoutMultiplier ?? 1.95;
          const potentialWin = c.buyPrice * (mult - 1);
          const isCurrentlyWinning =
            (c.contractType === 'CALL' && latestTick.quote > c.entrySpot) ||
            (c.contractType === 'PUT' && latestTick.quote < c.entrySpot) ||
            (c.contractType === 'DIGITEVEN' && latestTick.lastDigit % 2 === 0) ||
            (c.contractType === 'DIGITODD' && latestTick.lastDigit % 2 !== 0) ||
            (c.contractType === 'DIGITOVER' && latestTick.lastDigit > Number(c.barrier ?? 4)) ||
            (c.contractType === 'DIGITUNDER' && latestTick.lastDigit < Number(c.barrier ?? 4)) ||
            (c.contractType === 'DIGITMATCH' && latestTick.lastDigit === Number(c.barrier ?? 4)) ||
            (c.contractType === 'DIGITDIFF' && latestTick.lastDigit !== Number(c.barrier ?? 4));
          unrealizedProfit = Number(
            (isCurrentlyWinning ? potentialWin * 0.75 : -c.buyPrice * 0.75).toFixed(2)
          );
        }

        // Check Block 3 Early Sell Condition
        const earlySellHit =
          !knockedOut &&
          strat.enableSellConditions &&
          nextElapsed < c.durationTicks &&
          unrealizedProfit >= (c.buyPrice * strat.sellTakeProfitPct) / 100;

        if (knockedOut || earlySellHit || nextElapsed >= c.durationTicks) {
          // Settle Contract!
          setActiveExecutingBlock('restart');
          let didWin = false;
          let finalPayout = 0;

          if (earlySellHit) {
            didWin = true;
            finalPayout = Number((c.buyPrice + unrealizedProfit).toFixed(2));
          } else if (c.contractType === 'ACCU') {
            if (!knockedOut) {
              didWin = true;
              finalPayout = Number(
                (c.buyPrice * Math.pow(1 + (c.growthRate || 0.03), nextElapsed)).toFixed(2)
              );
            } else {
              didWin = false;
              finalPayout = 0;
            }
          } else {
            const bNum = Number(c.barrier ?? strat.prediction);
            switch (c.contractType) {
              case 'CALL':
                didWin = latestTick.quote > c.entrySpot;
                break;
              case 'PUT':
                didWin = latestTick.quote < c.entrySpot;
                break;
              case 'DIGITEVEN':
                didWin = latestTick.lastDigit % 2 === 0;
                break;
              case 'DIGITODD':
                didWin = latestTick.lastDigit % 2 !== 0;
                break;
              case 'DIGITOVER':
                didWin = latestTick.lastDigit > bNum;
                break;
              case 'DIGITUNDER':
                didWin = latestTick.lastDigit < bNum;
                break;
              case 'DIGITMATCH':
                didWin = latestTick.lastDigit === bNum;
                break;
              case 'DIGITDIFF':
                didWin = latestTick.lastDigit !== bNum;
                break;
            }
            const mult =
              TRADE_TYPE_OPTIONS.flatMap(g => g.directions).find(d => d.value === c.contractType)
                ?.payoutMultiplier ?? 1.95;
            finalPayout = didWin ? Number((c.buyPrice * mult).toFixed(2)) : 0;
          }

          const finalProfit = Number((finalPayout - c.buyPrice).toFixed(2));
          const settled: ContractRecord = {
            ...c,
            elapsedTicks: nextElapsed,
            currentSpot: latestTick.quote,
            exitSpot: latestTick.quote,
            payout: finalPayout,
            profit: finalProfit,
            status: didWin ? 'won' : 'lost',
            endTime: Date.now(),
            spotTrail: nextTrail,
          };

          if (finalPayout > 0) {
            adjustBalance(acct.loginid, finalPayout);
          }

          openContractRef.current = null;
          setOpenContract(null);
          setLastContract(settled);
          setTransactions(prev => prev.map(tx => (tx.id === settled.id ? settled : tx)));

          sessionNetProfitRef.current = Number((sessionNetProfitRef.current + finalProfit).toFixed(2));
          sessionRunsCountRef.current += 1;

          // Record per-bot lifetime vault performance
          setBotLifetimeStats(prev => {
            const existing = prev[strat.id] || {
              botId: strat.id,
              totalTrades: 0,
              wins: 0,
              losses: 0,
              netProfit: 0,
            };
            return {
              ...prev,
              [strat.id]: {
                botId: strat.id,
                totalTrades: existing.totalTrades + 1,
                wins: existing.wins + (didWin ? 1 : 0),
                losses: existing.losses + (didWin ? 0 : 1),
                netProfit: Number((existing.netProfit + finalProfit).toFixed(2)),
                lastRunAt: Date.now(),
              },
            };
          });

          if (didWin) {
            playSound('coins.mp3');
            if (strat.notifyOnTrade) {
              appendJournal(
                'success',
                `Contract WON (${settled.contractLabel}) | Exit: ${latestTick.quote.toFixed(symMeta.pipSize)} | Profit: +${finalProfit.toFixed(2)} ${settled.currency}`
              );
            }
          } else {
            if (strat.notifyOnTrade) {
              appendJournal(
                'error',
                `Contract LOST (${settled.contractLabel}) | Exit: ${latestTick.quote.toFixed(symMeta.pipSize)} | Loss: ${finalProfit.toFixed(2)} ${settled.currency}`
              );
            }
          }

          const activeRule = automationsRef.current[strat.id];
          const handoffToChainedBot = (triggerReason: string): boolean => {
            if (!isAutopilotArmedRef.current || !activeRule?.chainNextBotId) return false;
            const nextBot = savedStrategiesRef.current.find(
              b => b.id === activeRule.chainNextBotId && b.id !== strat.id
            );
            if (!nextBot) return false;

            const nextRule = automationsRef.current[nextBot.id];
            if (nextRule?.executionMode && nextRule.executionMode !== executionModeRef.current) {
              executionModeRef.current = nextRule.executionMode;
              setExecutionModeState(nextRule.executionMode);
            }

            strategyRef.current = nextBot;
            setStrategy(nextBot);
            if (nextBot.symbol !== activeSymbolRef.current) {
              activeSymbolRef.current = nextBot.symbol;
              setActiveSymbolState(nextBot.symbol);
              streamServiceRef.current?.switchSymbol(nextBot.symbol, chartGranularity);
            }

            sessionNetProfitRef.current = 0;
            sessionRunsCountRef.current = 0;
            oscarsCycleProfitRef.current = 0;
            sequenceStepRef.current = 0;
            cooldownRemainingRef.current = 0;
            alternateNextDirRef.current = 'CALL';

            const nextInitStake = Math.max(0.35, nextBot.initialStake);
            currentStakeRef.current = nextInitStake;
            setCurrentStake(nextInitStake);
            setContractStage(ContractStage.STARTING);

            appendJournal(
              'notify',
              `[Automation Chain] ${triggerReason} — Rotating to "${nextBot.name}" (${nextBot.symbol}).`
            );
            pushToast({
              type: 'info',
              title: 'Bot Automation Chained',
              message: `Handed off execution to "${nextBot.name}".`,
            });
            return true;
          };

          // Check Take Profit / Stop Loss / Max Session Runs Guards
          if (strat.takeProfit > 0 && sessionNetProfitRef.current >= strat.takeProfit) {
            playSound('job-done.mp3');
            const hitProfit = sessionNetProfitRef.current;
            pushToast({
              type: 'success',
              title: 'Target Profit Reached!',
              message: `Session profit +${hitProfit.toFixed(2)} ${acct.currency} met Take Profit (${strat.takeProfit}).`,
            });
            if (handoffToChainedBot(`Target Profit (+${hitProfit.toFixed(2)}) reached`)) {
              return;
            }
            stopBotInternal(
              `Target Profit reached (+${hitProfit.toFixed(2)} ${acct.currency}). Bot stopped automatically.`,
              'success'
            );
            return;
          }

          if (strat.stopLoss > 0 && -sessionNetProfitRef.current >= strat.stopLoss) {
            playSound('out-of-bounds.mp3');
            pushToast({
              type: 'error',
              title: 'Stop Loss Triggered',
              message: `Session drawdown ${sessionNetProfitRef.current.toFixed(2)} ${acct.currency} reached Stop Loss (${strat.stopLoss}).`,
            });
            stopBotInternal(
              `Stop Loss triggered (${sessionNetProfitRef.current.toFixed(2)} ${acct.currency}). Bot stopped to protect balance.`,
              'error'
            );
            return;
          }

          if (
            activeRule?.enabled &&
            activeRule.maxRunsPerSession > 0 &&
            sessionRunsCountRef.current >= activeRule.maxRunsPerSession
          ) {
            playSound('job-done.mp3');
            const runsDone = sessionRunsCountRef.current;
            if (handoffToChainedBot(`Max session runs (${runsDone}) completed`)) {
              return;
            }
            pushToast({
              type: 'info',
              title: 'Automation Session Complete',
              message: `"${strat.name}" completed ${runsDone} automated runs.`,
            });
            stopBotInternal(
              `Automation rule completed ${runsDone}/${activeRule.maxRunsPerSession} runs. Bot stopped.`,
              'info'
            );
            return;
          }

          if (!isBotRunningRef.current) {
            setContractStage(ContractStage.CONTRACT_CLOSED);
            setActiveExecutingBlock(null);
            return;
          }

          // Compute next stake via Block 4 Money Management
          const nextStake = computeNextStake(strat, didWin, c.buyPrice, finalProfit);
          currentStakeRef.current = nextStake;
          setCurrentStake(nextStake);

          if (isBotPausedRef.current) {
            setContractStage(ContractStage.PAUSED);
            setActiveExecutingBlock(null);
            appendJournal(
              'warn',
              `Active contract settled. Bot is now paused — next stake (${nextStake} ${acct.currency}) preserved.`
            );
            return;
          }

          cooldownRemainingRef.current =
            executionModeRef.current === 'fast' ? 0 : Math.max(0, strat.cooldownTicks);
          setContractStage(ContractStage.STARTING);
        } else {
          // Contract still open — update live spot & progress
          setActiveExecutingBlock('during');
          const updated: ContractRecord = {
            ...c,
            elapsedTicks: nextElapsed,
            currentSpot: latestTick.quote,
            profit: unrealizedProfit,
            spotTrail: nextTrail,
          };
          openContractRef.current = updated;
          setOpenContract(updated);
          setTransactions(prev => prev.map(tx => (tx.id === updated.id ? updated : tx)));
        }
        return;
      }

      // 2. If bot is running (and not paused) with no contract open, evaluate Block 2 Purchase Conditions
      if (!isBotRunningRef.current || isBotPausedRef.current) return;

      if (executionModeRef.current === 'fast') {
        cooldownRemainingRef.current = 0;
      } else if (cooldownRemainingRef.current > 0) {
        cooldownRemainingRef.current -= 1;
        appendJournal('info', `Cooldown active: waiting ${cooldownRemainingRef.current + 1} tick(s)...`);
        return;
      }

      setActiveExecutingBlock('purchase');
      setContractStage(ContractStage.PURCHASE_SENT);

      const readyToBuy = shouldTriggerPurchase(strat, allTicks);
      if (!readyToBuy) {
        return;
      }

      const stake = currentStakeRef.current;
      if (acct.balance < stake) {
        playSound('out-of-bounds.mp3');
        pushToast({
          type: 'error',
          title: 'Insufficient Balance',
          message: `Required stake ${stake} ${acct.currency} exceeds available balance ${acct.balance} ${acct.currency}.`,
        });
        stopBotInternal('Insufficient account balance to place next stake. Bot stopped.', 'error');
        return;
      }

      // Determine concrete contract direction
      let concreteDir: Exclude<ContractDirection, 'ALTERNATE'> =
        strat.contractDirection === 'ALTERNATE'
          ? alternateNextDirRef.current
          : strat.contractDirection;

      if (strat.contractDirection === 'ALTERNATE') {
        alternateNextDirRef.current = concreteDir === 'CALL' ? 'PUT' : 'CALL';
      }

      const symMeta = MARKET_SYMBOLS.find(m => m.symbol === strat.symbol) || MARKET_SYMBOLS[0];
      const dirMeta = TRADE_TYPE_OPTIONS.flatMap(g => g.directions).find(d => d.value === concreteDir);
      const standardDurationInTicks =
        strat.durationUnit === 't'
          ? Math.max(1, Math.min(10, Math.round(strat.duration)))
          : strat.durationUnit === 's'
          ? Math.max(2, Math.min(15, Math.round(strat.duration / 2)))
          : Math.max(5, Math.min(20, Math.round(strat.duration * 5)));

      const durationInTicks =
        executionModeRef.current === 'fast'
          ? strat.tradeType === 'accumulators'
            ? Math.max(2, Math.min(4, Math.round(strat.duration)))
            : strat.enableSellConditions
            ? Math.max(2, Math.min(4, Math.ceil(standardDurationInTicks / 2)))
            : 1
          : standardDurationInTicks;

      const barrierStr =
        strat.tradeType === 'digits_over_under' || strat.tradeType === 'digits_match_diff'
          ? String(strat.prediction)
          : undefined;

      const refId = `${Math.floor(48000000000 + Math.random() * 999999999)}`;
      const newContract: ContractRecord = {
        id: `contract-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        referenceId: refId,
        symbol: strat.symbol,
        symbolName: symMeta.displayName,
        tradeType: strat.tradeType,
        contractType: concreteDir,
        contractLabel:
          concreteDir === 'ACCU'
            ? `Accumulator (${Math.round(strat.growthRate * 100)}%)`
            : barrierStr !== undefined
            ? `${dirMeta?.label || concreteDir} ${barrierStr}`
            : dirMeta?.label || concreteDir,
        currency: acct.currency,
        buyPrice: stake,
        payout: 0,
        profit: 0,
        entrySpot: latestTick.quote,
        currentSpot: latestTick.quote,
        barrier: barrierStr,
        growthRate: strat.tradeType === 'accumulators' ? strat.growthRate : undefined,
        durationTicks: durationInTicks,
        elapsedTicks: 0,
        status: 'open',
        startTime: Date.now(),
        spotTrail: [{ epoch: latestTick.epoch, quote: latestTick.quote }],
      };

      adjustBalance(acct.loginid, -stake);
      openContractRef.current = newContract;
      setOpenContract(newContract);
      setTransactions(prev => [newContract, ...prev.slice(0, 99)]);
      setContractStage(ContractStage.PURCHASE_RECEIVED);

      if (strat.notifyOnTrade) {
        appendJournal(
          'notify',
          `Bought: ${newContract.contractLabel} on ${symMeta.displayName} @ ${latestTick.quote.toFixed(symMeta.pipSize)} (Stake: ${stake} ${acct.currency})`
        );
      }
    },
    [adjustBalance, appendJournal, computeNextStake, playSound, pushToast, shouldTriggerPurchase, stopBotInternal]
  );

  // Connect Deriv Market Stream Service
  useEffect(() => {
    const svc = new DerivMarketStreamService();
    streamServiceRef.current = svc;

    svc.connect(activeSymbol, chartGranularity, {
      onTicksSnapshot: snapshot => {
        setTicks(snapshot);
      },
      onTick: tick => {
        setTicks(prev => {
          const next = [...prev.slice(-179), tick];
          processEngineTick(tick, next);
          return next;
        });
      },
      onCandlesSnapshot: snapshot => {
        setCandles(snapshot);
      },
      onCandleUpdate: candle => {
        setCandles(prev => {
          if (prev.length === 0) return [candle];
          const last = prev[prev.length - 1];
          if (last.epoch === candle.epoch) {
            return [...prev.slice(0, -1), candle];
          }
          return [...prev.slice(-99), candle];
        });
      },
      onServerTime: (epoch, rtt) => {
        setServerTimeEpoch(epoch);
        setLatencyMs(rtt);
      },
      onConnectionChange: st => {
        setConnectionState(st);
      },
      onAuthResult: res => {
        if (!res.ok) {
          setAuthError(res.error || 'Could not authorize Deriv API token.');
          return;
        }
        setAuthError(null);
        const loginid = res.loginid || `CR${Math.floor(100000 + Math.random() * 900000)}`;
        const newAcc: AccountProfile = {
          loginid,
          label: `${res.isVirtual ? 'Deriv Demo' : 'Deriv Real'} (${res.currency || 'USD'})`,
          isDemo: Boolean(res.isVirtual),
          currency: res.currency || 'USD',
          balance: res.balance ?? 0,
          isApiConnected: true,
        };
        setAccounts(prev => {
          const filtered = prev.filter(a => a.loginid !== loginid);
          return [newAcc, ...filtered];
        });
        setActiveLoginId(loginid);
        pushToast({
          type: 'success',
          title: 'Deriv Account Connected',
          message: `Authorized ${loginid} (${newAcc.balance} ${newAcc.currency}).`,
        });
      },
    });

    return () => {
      svc.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep server clock ticking every second between WebSocket pings
  useEffect(() => {
    const t = setInterval(() => {
      setServerTimeEpoch(prev => prev + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Fast Mode Turbo Sub-Second Tick Evaluator (380ms cadence anchored to live Deriv spot)
  useEffect(() => {
    if (!isBotRunning || isBotPaused || executionMode !== 'fast') {
      return;
    }

    const timer = setInterval(() => {
      if (!isBotRunningRef.current || isBotPausedRef.current || executionModeRef.current !== 'fast') {
        return;
      }
      const currentList = ticksRef.current;
      if (currentList.length < 3) return;

      const last = currentList[currentList.length - 1];
      const symMeta =
        MARKET_SYMBOLS.find(m => m.symbol === activeSymbolRef.current) || MARKET_SYMBOLS[0];
      const step = (Math.random() - 0.5) * symMeta.volatility * 0.45;
      const nextQuote = Number(Math.max(0.0001, last.quote + step).toFixed(symMeta.pipSize));
      const formatted = nextQuote.toFixed(symMeta.pipSize);
      const lastDigit = Number(formatted[formatted.length - 1]) || 0;

      const turboTick: TickPoint = {
        epoch: Math.floor(Date.now() / 1000),
        quote: nextQuote,
        lastDigit,
      };

      const nextWindow = [...currentList.slice(-179), turboTick];
      ticksRef.current = nextWindow;
      setTicks(nextWindow);
      processEngineTick(turboTick, nextWindow);
    }, 380);

    return () => clearInterval(timer);
  }, [executionMode, isBotPaused, isBotRunning, processEngineTick]);

  const setActiveSymbol = useCallback((sym: string) => {
    setActiveSymbolState(sym);
    streamServiceRef.current?.switchSymbol(sym, chartGranularity);
  }, [chartGranularity]);

  const setChartGranularity = useCallback((sec: number) => {
    setChartGranularityState(sec);
    streamServiceRef.current?.switchSymbol(activeSymbol, sec);
  }, [activeSymbol]);

  // Strategy Mutation Actions
  const updateStrategy = useCallback(
    (patch: Partial<BotStrategyConfig>, recordHistory = true) => {
      setStrategy(prev => {
        if (recordHistory) {
          setPastStrategies(h => [...h.slice(-24), prev]);
          setFutureStrategies([]);
        }
        const updated: BotStrategyConfig = {
          ...prev,
          ...patch,
          updatedAt: Date.now(),
        };
        if (patch.symbol && patch.symbol !== activeSymbol) {
          setActiveSymbolState(patch.symbol);
          streamServiceRef.current?.switchSymbol(patch.symbol, chartGranularity);
        }
        return updated;
      });
    },
    [activeSymbol, chartGranularity]
  );

  const replaceStrategy = useCallback(
    (next: BotStrategyConfig) => {
      setPastStrategies(h => [...h.slice(-24), strategy]);
      setFutureStrategies([]);
      setStrategy(next);
      if (next.symbol !== activeSymbol) {
        setActiveSymbolState(next.symbol);
        streamServiceRef.current?.switchSymbol(next.symbol, chartGranularity);
      }
    },
    [activeSymbol, chartGranularity, strategy]
  );

  const undoStrategy = useCallback(() => {
    setPastStrategies(prevPast => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setFutureStrategies(f => [strategy, ...f]);
      setStrategy(previous);
      return prevPast.slice(0, -1);
    });
  }, [strategy]);

  const redoStrategy = useCallback(() => {
    setFutureStrategies(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPastStrategies(p => [...p, strategy]);
      setStrategy(next);
      return prevFuture.slice(1);
    });
  }, [strategy]);

  const resetWorkspace = useCallback(() => {
    replaceStrategy({
      ...DEFAULT_STRATEGY,
      id: `workspace-${Date.now()}`,
      updatedAt: Date.now(),
    });
    pushToast({
      type: 'info',
      title: 'Workspace Reset',
      message: 'Blocks restored to default HopeLogic trade configuration.',
    });
  }, [pushToast, replaceStrategy]);

  // Saved Strategies CRUD
  const downloadXmlForStrategy = useCallback((item: BotStrategyConfig) => {
    const xml = strategyToDerivXml(item);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeFile = item.name.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'hopelogic_bot';
    a.href = url;
    a.download = `${safeFile}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const saveCurrentStrategy = useCallback(
    (customName: string, downloadXml: boolean) => {
      const trimmed = customName.trim() || strategy.name || 'Untitled Bot';
      const toSave: BotStrategyConfig = {
        ...strategy,
        id: strategy.id.startsWith('default-') ? `saved-${Date.now()}` : strategy.id,
        name: trimmed,
        saveType: 'local',
        updatedAt: Date.now(),
      };
      setStrategy(toSave);
      setSavedStrategies(prev => {
        const exists = prev.some(item => item.id === toSave.id);
        if (exists) {
          return prev.map(item => (item.id === toSave.id ? toSave : item));
        }
        return [toSave, ...prev];
      });
      if (downloadXml) {
        downloadXmlForStrategy(toSave);
      }
      pushToast({
        type: 'success',
        title: 'Bot Stored',
        message: downloadXml
          ? `"${trimmed}" stored in Bots Vault and downloaded as .xml.`
          : `"${trimmed}" stored in Bots Vault.`,
      });
    },
    [downloadXmlForStrategy, pushToast, strategy]
  );

  const createStoredBot = useCallback(
    (bot: BotStrategyConfig) => {
      const entry: BotStrategyConfig = {
        ...bot,
        id: bot.id || `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        saveType: 'local',
        updatedAt: Date.now(),
      };
      setSavedStrategies(prev => [entry, ...prev]);
      pushToast({
        type: 'success',
        title: 'Bot Added to Vault',
        message: `"${entry.name}" saved to your Bots library.`,
      });
    },
    [pushToast]
  );

  const updateSavedBot = useCallback(
    (id: string, patch: Partial<BotStrategyConfig>) => {
      setSavedStrategies(prev =>
        prev.map(b => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b))
      );
      setStrategy(prev => (prev.id === id ? { ...prev, ...patch, updatedAt: Date.now() } : prev));
    },
    []
  );

  const toggleSavedBotFavorite = useCallback((id: string) => {
    setSavedStrategies(prev =>
      prev.map(b => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))
    );
  }, []);

  const deleteSavedStrategy = useCallback(
    (id: string) => {
      setSavedStrategies(prev => prev.filter(s => s.id !== id));
      setAutomations(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      pushToast({ type: 'info', title: 'Bot Deleted', message: 'Removed from your Bots library.' });
    },
    [pushToast]
  );

  const duplicateSavedStrategy = useCallback(
    (id: string) => {
      setSavedStrategies(prev => {
        const target = prev.find(s => s.id === id);
        if (!target) return prev;
        const copy: BotStrategyConfig = {
          ...target,
          id: `copy-${Date.now()}`,
          name: `${target.name} (Copy)`,
          saveType: 'local',
          updatedAt: Date.now(),
        };
        return [copy, ...prev];
      });
      pushToast({ type: 'success', title: 'Bot Duplicated' });
    },
    [pushToast]
  );

  const loadStrategyIntoBuilder = useCallback(
    (item: BotStrategyConfig, switchTab = true) => {
      replaceStrategy({ ...item, updatedAt: Date.now() });
      if (switchTab) {
        setActiveTab(BotTab.BOT_BUILDER);
      }
      appendJournal('info', `Loaded strategy "${item.name}" into Bot Builder (${item.symbol}).`);
      pushToast({
        type: 'success',
        title: 'Strategy Loaded',
        message: `"${item.name}" is ready in Bot Builder.`,
      });
    },
    [appendJournal, pushToast, replaceStrategy]
  );

  const importXmlContent = useCallback(
    (xmlString: string, fileName: string, stayOnCurrentTab = false) => {
      const parsed = parseDerivXmlToStrategy(xmlString, fileName);
      setSavedStrategies(prev => [parsed, ...prev]);
      replaceStrategy(parsed);
      if (!stayOnCurrentTab) {
        setActiveTab(BotTab.BOT_BUILDER);
      }
      appendJournal('success', `Imported XML bot "${parsed.name}" (${parsed.symbol}).`);
      pushToast({
        type: 'success',
        title: 'XML Bot Stored',
        message: stayOnCurrentTab
          ? `"${parsed.name}" added to your Bots library.`
          : `Loaded "${parsed.name}" into Bot Builder.`,
      });
    },
    [appendJournal, pushToast, replaceStrategy]
  );

  const getAutomationForBot = useCallback(
    (botId: string): BotAutomationRule => {
      return automations[botId] || createDefaultAutomationRule(botId);
    },
    [automations]
  );

  const updateBotAutomation = useCallback(
    (botId: string, patch: Partial<BotAutomationRule>) => {
      setAutomations(prev => {
        const current = prev[botId] || createDefaultAutomationRule(botId);
        return {
          ...prev,
          [botId]: {
            ...current,
            ...patch,
            botId,
          },
        };
      });
    },
    []
  );

  const setIsAutopilotArmed = useCallback(
    (armed: boolean) => {
      isAutopilotArmedRef.current = armed;
      setIsAutopilotArmedState(armed);
      playSound('click.mp3');
      appendJournal(
        armed ? 'notify' : 'warn',
        armed
          ? 'Bot Automation Autopilot ARMED — monitoring scheduled, interval, and signal triggers.'
          : 'Bot Automation Autopilot set to STANDBY.'
      );
      pushToast({
        type: armed ? 'success' : 'info',
        title: armed ? 'Autopilot Armed' : 'Autopilot Standby',
        message: armed
          ? 'Automated bot triggers and bot chaining are active.'
          : 'Automated triggers paused; manual bot runs remain available.',
      });
    },
    [appendJournal, playSound, pushToast]
  );

  const resetBotLifetimeStats = useCallback(
    (botId: string) => {
      setBotLifetimeStats(prev => {
        const copy = { ...prev };
        delete copy[botId];
        return copy;
      });
      pushToast({ type: 'info', title: 'Bot Lifetime Stats Cleared' });
    },
    [pushToast]
  );

  // Bot Run / Pause / Resume / Stop & Execution Mode Controls
  const setExecutionMode = useCallback(
    (mode: BotExecutionMode) => {
      if (executionModeRef.current === mode) return;
      executionModeRef.current = mode;
      setExecutionModeState(mode);
      playSound('click.mp3');
      appendJournal(
        'info',
        mode === 'fast'
          ? 'Execution mode set to Fast Mode (Turbo sub-second cadence, zero cooldown).'
          : 'Execution mode set to Normal Mode (Standard live Deriv tick cadence).'
      );
      pushToast({
        type: 'info',
        title: mode === 'fast' ? 'Fast Mode Activated' : 'Normal Mode Activated',
        message:
          mode === 'fast'
            ? 'Turbo sub-second execution with zero cooldown.'
            : 'Standard tick-by-tick Deriv market execution.',
      });
    },
    [appendJournal, playSound, pushToast]
  );

  const startBot = useCallback(
    (overrideStrategy?: BotStrategyConfig) => {
      const targetStrat = overrideStrategy || strategyRef.current;
      if (overrideStrategy) {
        strategyRef.current = overrideStrategy;
        setStrategy(overrideStrategy);
        if (overrideStrategy.symbol !== activeSymbol) {
          activeSymbolRef.current = overrideStrategy.symbol;
          setActiveSymbolState(overrideStrategy.symbol);
          streamServiceRef.current?.switchSymbol(overrideStrategy.symbol, chartGranularity);
        }
      }

      sessionNetProfitRef.current = 0;
      sessionRunsCountRef.current = 0;
      oscarsCycleProfitRef.current = 0;
      sequenceStepRef.current = 0;
      cooldownRemainingRef.current = 0;
      alternateNextDirRef.current = 'CALL';

      const initStake = Math.max(0.35, targetStrat.initialStake);
      currentStakeRef.current = initStake;
      setCurrentStake(initStake);

      isBotPausedRef.current = false;
      setIsBotPaused(false);
      isBotRunningRef.current = true;
      setIsBotRunning(true);
      setIsDrawerOpen(true);
      setContractStage(ContractStage.STARTING);
      setActiveExecutingBlock('trade_params');
      playSound('announcement.mp3');

      appendJournal(
        'info',
        `Bot started (${executionModeRef.current === 'fast' ? 'Fast Mode' : 'Normal Mode'}): "${targetStrat.name}" on ${targetStrat.symbol} | Initial Stake: ${initStake} ${activeAccount.currency} | System: ${targetStrat.strategySystem}`
      );
    },
    [activeAccount.currency, activeSymbol, appendJournal, chartGranularity, playSound]
  );

  const pauseBot = useCallback(() => {
    if (!isBotRunningRef.current || isBotPausedRef.current) return;
    isBotPausedRef.current = true;
    setIsBotPaused(true);
    playSound('click.mp3');

    if (openContractRef.current) {
      appendJournal(
        'warn',
        'Pause requested — active open contract will settle before pausing new purchases.'
      );
    } else {
      setContractStage(ContractStage.PAUSED);
      setActiveExecutingBlock(null);
      appendJournal(
        'warn',
        `Bot paused. Current stake (${currentStakeRef.current} ${activeAccount.currency}) and session counters preserved.`
      );
    }
  }, [activeAccount.currency, appendJournal, playSound]);

  const resumeBot = useCallback(() => {
    if (!isBotRunningRef.current || !isBotPausedRef.current) return;
    isBotPausedRef.current = false;
    setIsBotPaused(false);
    setContractStage(ContractStage.STARTING);
    setActiveExecutingBlock('purchase');
    playSound('click.mp3');
    appendJournal(
      'info',
      `Bot resumed (${executionModeRef.current === 'fast' ? 'Fast Mode' : 'Normal Mode'}) | Active Stake: ${currentStakeRef.current} ${activeAccount.currency}`
    );
  }, [activeAccount.currency, appendJournal, playSound]);

  const stopBot = useCallback(
    (reason?: string) => {
      playSound('click.mp3');
      stopBotInternal(reason || 'Bot stopped by user.', 'warn');
    },
    [playSound, stopBotInternal]
  );

  const clearStatsAndLogs = useCallback(() => {
    if (isBotRunningRef.current) {
      isBotRunningRef.current = false;
      setIsBotRunning(false);
    }
    if (isBotPausedRef.current) {
      isBotPausedRef.current = false;
      setIsBotPaused(false);
    }
    if (openContractRef.current) {
      adjustBalance(activeAccountRef.current.loginid, openContractRef.current.buyPrice);
      openContractRef.current = null;
    }

    const baseStake = Math.max(0.35, strategyRef.current.initialStake);
    currentStakeRef.current = baseStake;
    setCurrentStake(baseStake);

    sessionNetProfitRef.current = 0;
    sessionRunsCountRef.current = 0;
    oscarsCycleProfitRef.current = 0;
    sequenceStepRef.current = 0;
    cooldownRemainingRef.current = 0;
    alternateNextDirRef.current = 'CALL';

    setActiveExecutingBlock(null);
    setOpenContract(null);
    setLastContract(null);
    setSelectedContractDetail(null);
    setTransactions([]);
    setJournal([]);
    setContractStage(ContractStage.NOT_RUNNING);

    playSound('delete.mp3');
    pushToast({
      type: 'info',
      title: 'Run Panel Reset',
      message: 'Summary, transactions, journal, and all counters reset to zero.',
    });
  }, [adjustBalance, playSound, pushToast]);

  // Background Automation Scheduler (evaluates Scheduled Time, Interval Timer, & Signal Match triggers when Autopilot is Armed)
  useEffect(() => {
    if (!isAutopilotArmed || isBotRunning) {
      return;
    }

    const scheduler = setInterval(() => {
      if (!isAutopilotArmedRef.current || isBotRunningRef.current) return;

      const now = Date.now();
      const dateObj = new Date(now);
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const mm = String(dateObj.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;
      const todayKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      for (const bot of savedStrategiesRef.current) {
        const rule = automationsRef.current[bot.id];
        if (!rule || !rule.enabled || rule.triggerType === 'manual') continue;

        let shouldLaunch = false;
        let triggerDesc = '';

        if (rule.triggerType === 'scheduled_time') {
          if (rule.scheduledTime === currentHHMM && rule.lastScheduledDate !== todayKey) {
            shouldLaunch = true;
            triggerDesc = `Scheduled clock trigger (${currentHHMM})`;
          }
        } else if (rule.triggerType === 'timer_interval') {
          const waitMs = Math.max(1, rule.intervalMinutes) * 60 * 1000;
          if (!rule.lastTriggeredAt || now - rule.lastTriggeredAt >= waitMs) {
            shouldLaunch = true;
            triggerDesc = `Interval cycle trigger (every ${rule.intervalMinutes}m)`;
          }
        } else if (rule.triggerType === 'signal_match') {
          const minCooldownElapsed = !rule.lastTriggeredAt || now - rule.lastTriggeredAt >= 20000;
          if (minCooldownElapsed && ticksRef.current.length >= 4) {
            if (shouldTriggerPurchase(bot, ticksRef.current)) {
              shouldLaunch = true;
              triggerDesc = `Live market signal trigger (${bot.conditionType})`;
            }
          }
        }

        if (shouldLaunch) {
          setAutomations(prev => ({
            ...prev,
            [bot.id]: {
              ...rule,
              lastTriggeredAt: now,
              lastScheduledDate:
                rule.triggerType === 'scheduled_time' ? todayKey : rule.lastScheduledDate,
            },
          }));

          if (rule.autoResetBeforeStart) {
            setTransactions([]);
            setOpenContract(null);
            setLastContract(null);
          }

          if (rule.executionMode !== executionModeRef.current) {
            executionModeRef.current = rule.executionMode;
            setExecutionModeState(rule.executionMode);
          }

          appendJournal('notify', `[Autopilot] ${triggerDesc} -> Auto-starting "${bot.name}".`);
          pushToast({
            type: 'success',
            title: 'Automated Bot Started',
            message: `"${bot.name}" launched via ${triggerDesc}.`,
          });
          startBot(bot);
          break;
        }
      }
    }, 1500);

    return () => clearInterval(scheduler);
  }, [appendJournal, isAutopilotArmed, isBotRunning, pushToast, shouldTriggerPurchase, startBot]);

  const switchAccount = useCallback(
    (loginid: string) => {
      if (isBotRunningRef.current) {
        stopBotInternal('Bot stopped automatically due to account switch.', 'warn');
      }
      setActiveLoginId(loginid);
      const target = accounts.find(a => a.loginid === loginid);
      if (target) {
        appendJournal('info', `Switched active account to ${target.loginid} (${target.currency}).`);
      }
    },
    [accounts, appendJournal, stopBotInternal]
  );

  const resetDemoBalance = useCallback(() => {
    setAccounts(prev =>
      prev.map(acc => {
        if (!acc.isDemo || acc.loginid !== activeAccount.loginid) return acc;
        return {
          ...acc,
          balance: acc.currency === 'BTC' ? 0.25 : 10000.0,
        };
      })
    );
    pushToast({
      type: 'success',
      title: 'Demo Balance Reset',
      message: `${activeAccount.loginid} restored to starting balance.`,
    });
  }, [activeAccount.loginid, pushToast]);

  const connectDerivToken = useCallback((token: string) => {
    setAuthError(null);
    streamServiceRef.current?.authorizeWithToken(token);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value: BotContextValue = {
    activeTab,
    setActiveTab,
    isDark,
    toggleTheme,
    isSoundEnabled,
    toggleSound,
    isQuickStrategyOpen,
    openQuickStrategy,
    closeQuickStrategy,
    preselectedQuickStrategy,
    isLoadModalOpen,
    setIsLoadModalOpen,
    isSaveModalOpen,
    setIsSaveModalOpen,
    selectedContractDetail,
    setSelectedContractDetail,
    accounts,
    activeAccount,
    switchAccount,
    resetDemoBalance,
    connectDerivToken,
    authError,
    clearAuthError,
    activeSymbol,
    setActiveSymbol,
    chartGranularity,
    setChartGranularity,
    ticks,
    candles,
    connectionState,
    serverTimeEpoch,
    latencyMs,
    strategy,
    updateStrategy,
    replaceStrategy,
    undoStrategy,
    redoStrategy,
    canUndo: pastStrategies.length > 0,
    canRedo: futureStrategies.length > 0,
    resetWorkspace,
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
    contractStage,
    currentStake,
    activeExecutingBlock,
    startBot,
    pauseBot,
    resumeBot,
    stopBot,
    isDrawerOpen,
    setIsDrawerOpen,
    runPanelTab,
    setRunPanelTab,
    openContract,
    lastContract,
    transactions,
    journal,
    statistics,
    clearStatsAndLogs,
    toasts,
    pushToast,
    dismissToast,
  };

  return <BotContext.Provider value={value}>{children}</BotContext.Provider>;
};

export function useBot(): BotContextValue {
  const ctx = useContext(BotContext);
  if (!ctx) {
    throw new Error('useBot must be used within BotProvider');
  }
  return ctx;
}
