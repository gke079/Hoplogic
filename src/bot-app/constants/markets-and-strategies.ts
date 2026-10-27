import {
  BotStrategyConfig,
  MarketSymbol,
  QuickStrategyMeta,
  TradeTypeGroup,
  ContractDirection,
} from '../types/bot.types';

export const MARKET_SYMBOLS: MarketSymbol[] = [
  {
    symbol: '1HZ100V',
    displayName: 'Volatility 100 (1s) Index',
    shortCode: '100 (1s)',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 2,
    basePrice: 1245.5,
    volatility: 1.8,
  },
  {
    symbol: 'R_100',
    displayName: 'Volatility 100 Index',
    shortCode: 'V100',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 2,
    basePrice: 1892.35,
    volatility: 2.1,
  },
  {
    symbol: '1HZ75V',
    displayName: 'Volatility 75 (1s) Index',
    shortCode: '75 (1s)',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 2,
    basePrice: 6840.2,
    volatility: 4.5,
  },
  {
    symbol: 'R_75',
    displayName: 'Volatility 75 Index',
    shortCode: 'V75',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 4,
    basePrice: 94210.4512,
    volatility: 35.0,
  },
  {
    symbol: '1HZ50V',
    displayName: 'Volatility 50 (1s) Index',
    shortCode: '50 (1s)',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 2,
    basePrice: 418.75,
    volatility: 0.9,
  },
  {
    symbol: 'R_50',
    displayName: 'Volatility 50 Index',
    shortCode: 'V50',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 4,
    basePrice: 214.8834,
    volatility: 0.35,
  },
  {
    symbol: '1HZ25V',
    displayName: 'Volatility 25 (1s) Index',
    shortCode: '25 (1s)',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 2,
    basePrice: 3120.1,
    volatility: 1.1,
  },
  {
    symbol: '1HZ10V',
    displayName: 'Volatility 10 (1s) Index',
    shortCode: '10 (1s)',
    market: 'derived_volatility',
    marketLabel: 'Continuous Indices',
    pipSize: 2,
    basePrice: 8945.6,
    volatility: 0.7,
  },
  {
    symbol: 'BOOM1000',
    displayName: 'Boom 1000 Index',
    shortCode: 'B1000',
    market: 'crash_boom',
    marketLabel: 'Crash/Boom Indices',
    pipSize: 2,
    basePrice: 14120.8,
    volatility: 2.8,
  },
  {
    symbol: 'CRASH1000',
    displayName: 'Crash 1000 Index',
    shortCode: 'C1000',
    market: 'crash_boom',
    marketLabel: 'Crash/Boom Indices',
    pipSize: 2,
    basePrice: 6785.4,
    volatility: 2.8,
  },
  {
    symbol: 'JD50',
    displayName: 'Jump 50 Index',
    shortCode: 'JD50',
    market: 'jump_indices',
    marketLabel: 'Jump Indices',
    pipSize: 2,
    basePrice: 34210.9,
    volatility: 5.5,
  },
  {
    symbol: 'frxEURUSD',
    displayName: 'EUR/USD',
    shortCode: 'EURUSD',
    market: 'forex',
    marketLabel: 'Forex Major Pairs',
    pipSize: 5,
    basePrice: 1.08452,
    volatility: 0.00018,
  },
  {
    symbol: 'frxGBPUSD',
    displayName: 'GBP/USD',
    shortCode: 'GBPUSD',
    market: 'forex',
    marketLabel: 'Forex Major Pairs',
    pipSize: 5,
    basePrice: 1.29315,
    volatility: 0.00022,
  },
  {
    symbol: 'cryBTCUSD',
    displayName: 'BTC/USD',
    shortCode: 'BTCUSD',
    market: 'crypto',
    marketLabel: 'Cryptocurrencies',
    pipSize: 2,
    basePrice: 87420.5,
    volatility: 28.0,
  },
];

export const TRADE_TYPE_OPTIONS: {
  value: TradeTypeGroup;
  label: string;
  directions: { value: ContractDirection; label: string; payoutMultiplier: number }[];
}[] = [
  {
    value: 'ups_downs',
    label: 'Up/Down (Rise/Fall)',
    directions: [
      { value: 'CALL', label: 'Rise (Call)', payoutMultiplier: 1.95 },
      { value: 'PUT', label: 'Fall (Put)', payoutMultiplier: 1.95 },
      { value: 'ALTERNATE', label: 'Alternate Rise & Fall', payoutMultiplier: 1.95 },
    ],
  },
  {
    value: 'digits_even_odd',
    label: 'Digits: Even/Odd',
    directions: [
      { value: 'DIGITEVEN', label: 'Even', payoutMultiplier: 1.96 },
      { value: 'DIGITODD', label: 'Odd', payoutMultiplier: 1.96 },
    ],
  },
  {
    value: 'digits_over_under',
    label: 'Digits: Over/Under',
    directions: [
      { value: 'DIGITOVER', label: 'Over Prediction', payoutMultiplier: 2.35 },
      { value: 'DIGITUNDER', label: 'Under Prediction', payoutMultiplier: 2.35 },
    ],
  },
  {
    value: 'digits_match_diff',
    label: 'Digits: Matches/Differs',
    directions: [
      { value: 'DIGITDIFF', label: 'Differs', payoutMultiplier: 1.09 },
      { value: 'DIGITMATCH', label: 'Matches', payoutMultiplier: 9.0 },
    ],
  },
  {
    value: 'accumulators',
    label: 'Accumulators',
    directions: [
      { value: 'ACCU', label: 'Buy Accumulator', payoutMultiplier: 1.0 },
    ],
  },
];

export const QUICK_STRATEGIES: QuickStrategyMeta[] = [
  {
    id: 'MARTINGALE',
    label: 'Martingale',
    tagline: 'Recover prior losses on the first winning trade by multiplying stake after a loss.',
    description: [
      'The Martingale strategy is a classic negative-progression money management system.',
      'Whenever a contract closes in a loss, the next stake is multiplied by your configured Size multiplier (typically 2x).',
      'As soon as a contract wins, your stake immediately resets back to the Initial Stake, locking in net recovery plus base profit.',
    ],
    formulaSummary: 'On Loss: Next Stake = Current Stake × Size  |  On Win: Next Stake = Initial Stake',
    riskLevel: 'High',
    diagramUrl: '/assets/images/martingale.svg',
    defaultMultiplier: 2,
    defaultUnit: 1,
  },
  {
    id: 'D_ALEMBERT',
    label: "D'Alembert",
    tagline: 'Linear stake progression that adds one unit after a loss and subtracts one unit after a win.',
    description: [
      "Named after 18th-century French mathematician Jean le Rond d'Alembert, this strategy smooths drawdowns compared to exponential Martingale.",
      'After a losing contract, your next stake increases by your fixed Unit value.',
      'After a winning contract, your next stake decreases by one Unit value (never dropping below your Initial Stake).',
    ],
    formulaSummary: 'On Loss: Stake = Stake + (Unit × Initial)  |  On Win: Stake = max(Initial, Stake − Unit × Initial)',
    riskLevel: 'Moderate',
    diagramUrl: '/assets/images/dalembert.svg',
    defaultMultiplier: 2,
    defaultUnit: 1,
  },
  {
    id: 'OSCARS_GRIND',
    label: "Oscar's Grind",
    tagline: 'Conservative cycle-based progression aiming to win exactly one base unit per cycle.',
    description: [
      "Oscar's Grind divides trading into discrete sessions, each aiming to earn +1 Initial Stake unit of net profit.",
      'When a trade loses, the stake stays unchanged to prevent runaway exposure during losing streaks.',
      'When a trade wins while the cycle is still negative, the stake increases by 1 unit—capped so the next win never overshoots the +1 unit cycle target.',
    ],
    formulaSummary: 'On Loss: Keep Stake  |  On Win (Cycle < +1u): Stake + 1u  |  Cycle >= +1u: Reset to Initial',
    riskLevel: 'Controlled',
    diagramUrl: '/assets/images/oscars_grind.png',
    defaultMultiplier: 2,
    defaultUnit: 1,
  },
  {
    id: 'REVERSE_MARTINGALE',
    label: 'Reverse Martingale',
    tagline: 'Anti-Martingale momentum system that compounds winning streaks and resets on loss.',
    description: [
      'Also known as the Paroli system, Reverse Martingale risks house profit during hot streaks while keeping losses strictly bounded.',
      'After every winning contract, the stake is multiplied by Size (e.g. 2x) to compound consecutive wins.',
      'After any losing contract—or upon reaching Maximum Stake—the bot resets cleanly to your Initial Stake.',
    ],
    formulaSummary: 'On Win: Next Stake = Current Stake × Size  |  On Loss: Next Stake = Initial Stake',
    riskLevel: 'Controlled',
    diagramUrl: '/assets/images/reverse_martingale.svg',
    defaultMultiplier: 2,
    defaultUnit: 1,
  },
  {
    id: 'REVERSE_D_ALEMBERT',
    label: "Reverse D'Alembert",
    tagline: 'Gradually scales stake upward on wins and steps down by one unit on losses.',
    description: [
      "Reverse D'Alembert captures favourable win-rate regimes with gentle linear sizing.",
      'Each winning trade adds one Unit to your next stake; each losing trade subtracts one Unit down to your Initial Stake floor.',
    ],
    formulaSummary: 'On Win: Stake = Stake + Unit  |  On Loss: Stake = max(Initial, Stake − Unit)',
    riskLevel: 'Controlled',
    diagramUrl: '/assets/images/reverse_dalembert.svg',
    defaultMultiplier: 2,
    defaultUnit: 1,
  },
  {
    id: 'STRATEGY_1_3_2_6',
    label: '1-3-2-6',
    tagline: 'Four-stage positive progression sequence (1x, 3x, 2x, 6x) designed for 4-win bursts.',
    description: [
      'The 1-3-2-6 sequence structures stakes across four consecutive wins: 1×, 3×, 2×, and 6× your Initial Stake.',
      'Winning the first two trades already banks profit so Stage 3 risks none of your starting capital.',
      'Any loss—or completing all four stages—immediately resets the sequence back to Stage 1 (1× Initial Stake).',
    ],
    formulaSummary: 'Sequence: [1×, 3×, 2×, 6×] × Initial Stake on consecutive Wins  |  Reset to 1× on Loss or Step 4 Win',
    riskLevel: 'Controlled',
    diagramUrl: '/assets/images/1-3-2-6.svg',
    defaultMultiplier: 2,
    defaultUnit: 1,
  },
];

export const DEFAULT_STRATEGY: BotStrategyConfig = {
  id: 'default-hopelogic-martingale',
  name: 'HopeLogic Volatility 100 Martingale',
  saveType: 'unsaved',
  updatedAt: Date.now(),
  description: 'Automated Rise/Fall strategy on Volatility 100 (1s) Index with Martingale recovery and strict Take Profit / Stop Loss guards.',
  market: 'derived_volatility',
  symbol: '1HZ100V',
  tradeType: 'ups_downs',
  contractDirection: 'CALL',
  candleInterval: 60,
  duration: 2,
  durationUnit: 't',
  initialStake: 1,
  prediction: 4,
  growthRate: 0.03,
  conditionType: 'every_tick',
  fastPeriod: 5,
  slowPeriod: 14,
  rsiPeriod: 14,
  rsiThreshold: 30,
  digitStreakCount: 2,
  digitStreakTarget: 'even',
  enableSellConditions: false,
  sellTakeProfitPct: 50,
  sellStopLossPct: 50,
  strategySystem: 'MARTINGALE',
  sizeMultiplier: 2,
  unitAmount: 1,
  maxStakeEnabled: true,
  maxStake: 64,
  takeProfit: 25,
  stopLoss: 50,
  restartOnError: true,
  cooldownTicks: 0,
  notifyOnTrade: true,
  variables: [
    { id: 'v1', name: 'Initial Stake', value: 1 },
    { id: 'v2', name: 'Martingale Split', value: 2 },
    { id: 'v3', name: 'Target Profit', value: 25 },
    { id: 'v4', name: 'Stop Loss', value: 50 },
  ],
};

export const SAMPLE_STRATEGIES: BotStrategyConfig[] = [
  {
    ...DEFAULT_STRATEGY,
    id: 'sample-martingale-1hz100v',
    name: 'Volatility 100 (1s) Rise/Fall Martingale',
    saveType: 'sample',
    updatedAt: Date.now() - 3600_000 * 2,
  },
  {
    ...DEFAULT_STRATEGY,
    id: 'sample-rsi-reversal',
    name: 'RSI Oversold Reversal (V75 1s)',
    saveType: 'sample',
    description: 'Purchases Rise when 14-period RSI dips below 35 on Volatility 75 (1s) using D\'Alembert sizing.',
    symbol: '1HZ75V',
    conditionType: 'rsi_threshold',
    rsiPeriod: 14,
    rsiThreshold: 35,
    strategySystem: 'D_ALEMBERT',
    unitAmount: 1,
    initialStake: 2,
    takeProfit: 30,
    stopLoss: 40,
    updatedAt: Date.now() - 3600_000 * 6,
  },
  {
    ...DEFAULT_STRATEGY,
    id: 'sample-even-odd-streak',
    name: 'Even/Odd Digit Streak Hunter',
    saveType: 'sample',
    description: 'Watches for 2 consecutive Odd last digits on Volatility 10 (1s), then buys Even with Oscar\'s Grind.',
    symbol: '1HZ10V',
    tradeType: 'digits_even_odd',
    contractDirection: 'DIGITEVEN',
    duration: 1,
    conditionType: 'last_digit_streak',
    digitStreakCount: 2,
    digitStreakTarget: 'odd',
    strategySystem: 'OSCARS_GRIND',
    initialStake: 1,
    takeProfit: 15,
    stopLoss: 25,
    updatedAt: Date.now() - 3600_000 * 12,
  },
  {
    ...DEFAULT_STRATEGY,
    id: 'sample-sma-crossover',
    name: 'SMA 5/14 Momentum Crossover',
    saveType: 'sample',
    description: 'Triggers Call when Fast SMA(5) trades above Slow SMA(14) with 1-3-2-6 positive progression.',
    symbol: 'R_100',
    conditionType: 'sma_cross',
    fastPeriod: 5,
    slowPeriod: 14,
    strategySystem: 'STRATEGY_1_3_2_6',
    initialStake: 2,
    duration: 3,
    takeProfit: 40,
    stopLoss: 30,
    updatedAt: Date.now() - 3600_000 * 24,
  },
  {
    ...DEFAULT_STRATEGY,
    id: 'sample-accumulator-3pct',
    name: '3% Accumulator Compounder',
    saveType: 'sample',
    description: 'Compounds tick-by-tick at 3% growth rate with automated early profit lock at +45%.',
    symbol: '1HZ50V',
    tradeType: 'accumulators',
    contractDirection: 'ACCU',
    growthRate: 0.03,
    duration: 5,
    enableSellConditions: true,
    sellTakeProfitPct: 45,
    strategySystem: 'REVERSE_D_ALEMBERT',
    initialStake: 5,
    takeProfit: 50,
    stopLoss: 35,
    updatedAt: Date.now() - 3600_000 * 48,
  },
];

export const TUTORIAL_VIDEOS = [
  {
    id: 'tour-intro',
    title: 'Introduction to Deriv Bot & HopeLogic Workspace',
    duration: '1:45',
    thumbnail: '/assets/images/intro_to_deriv_bot.webp',
    videoSrc: '/assets/videos/dbot-onboarding-tour-step-1.mp4',
    summary: 'Explore the 4 core tabs—Dashboard, Bot Builder, Charts, and Tutorials—and see how strategies connect to live Deriv WebSocket streams.',
  },
  {
    id: 'tour-build',
    title: 'How to Build a Trading Bot from Blocks',
    duration: '2:15',
    thumbnail: '/assets/images/build_a_bot.webp',
    videoSrc: '/assets/videos/dbot-onboarding-tour-step-2.mp4',
    summary: 'Configure Market & Trade Parameters, attach Technical Indicator purchase conditions, and set automated Restart rules.',
  },
  {
    id: 'tour-martingale',
    title: 'Using Quick Strategies & Risk Controls',
    duration: '2:05',
    thumbnail: '/assets/images/how_to_use_martingale.webp',
    videoSrc: '/assets/videos/dbot-onboarding-tour-step-3.mp4',
    summary: 'Launch Martingale, D\'Alembert, Oscar\'s Grind, or 1-3-2-6 in seconds with Maximum Stake, Take Profit, and Stop Loss guards.',
  },
  {
    id: 'tour-accumulators',
    title: 'Automating Accumulators & Monitoring Run Panel',
    duration: '1:50',
    thumbnail: '/assets/images/introducing_accumulators_on_deriv_bot.webp',
    videoSrc: '/assets/videos/bot-builder-tour-step-4.mp4',
    summary: 'Track live spot trajectories, transaction logs, and real-time journal notifications inside the collapsible Run Panel.',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'What is HopeLogic Deriv Bot?',
    a: 'HopeLogic is a visual algorithmic trading workspace built for Deriv markets. You can assemble automated trading bots without writing code using interlocking logic blocks or launch pre-engineered Quick Strategies across Synthetic Indices, Forex, and Crypto.',
  },
  {
    q: 'How do I import or export existing Deriv Bot (.xml) strategies?',
    a: 'Click "My computer" on the Dashboard or the Import icon in the Bot Builder toolbar to drag-and-drop any Deriv Bot Blockly .xml file. Clicking Save lets you store strategies in your browser or download standard Deriv Bot .xml files.',
  },
  {
    q: 'Does the platform use real-time market prices?',
    a: 'Yes. Charts and the Bot Execution Engine stream real-time tick quotes, historical OHLC candles, and UTC server time directly from Deriv\'s live WebSocket feed (wss://ws.derivws.com/websockets/v3).',
  },
  {
    q: 'How do Take Profit, Stop Loss, and Maximum Stake protect my balance?',
    a: 'Before every new contract run, Block 4 evaluates your cumulative session profit/loss against your Take Profit and Stop Loss thresholds and automatically halts execution once either threshold is reached. Maximum Stake caps stake escalation during progression sequences.',
  },
  {
    q: 'Can I test strategies risk-free before connecting a live account?',
    a: 'Yes! Your workspace starts with a pre-funded $10,000.00 USD Demo Virtual account (VRTC) that executes against real-time live Deriv market ticks, and you can reset your Demo balance anytime from the Account Switcher.',
  },
];

/**
 * Serializes a BotStrategyConfig into authentic Deriv Bot Blockly XML
 */
export function strategyToDerivXml(strategy: BotStrategyConfig): string {
  const escapedName = strategy.name.replace(/[<>&"']/g, '');
  return `<xml xmlns="http://www.w3.org/1999/xhtml" is_dbot="true" collection="false">
  <variables>
    <variable type="" id="var_stake" islocal="false" iscloud="false">Initial Stake</variable>
    <variable type="" id="var_tp" islocal="false" iscloud="false">Take Profit</variable>
    <variable type="" id="var_sl" islocal="false" iscloud="false">Stop Loss</variable>
    <variable type="" id="var_size" islocal="false" iscloud="false">Multiplier Size</variable>
  </variables>
  <!-- HopeLogic Metadata: ${JSON.stringify({
    name: escapedName,
    tradeType: strategy.tradeType,
    contractDirection: strategy.contractDirection,
    conditionType: strategy.conditionType,
    strategySystem: strategy.strategySystem,
    sizeMultiplier: strategy.sizeMultiplier,
    unitAmount: strategy.unitAmount,
    maxStakeEnabled: strategy.maxStakeEnabled,
    maxStake: strategy.maxStake,
    takeProfit: strategy.takeProfit,
    stopLoss: strategy.stopLoss,
    prediction: strategy.prediction,
    growthRate: strategy.growthRate,
    fastPeriod: strategy.fastPeriod,
    slowPeriod: strategy.slowPeriod,
    rsiPeriod: strategy.rsiPeriod,
    rsiThreshold: strategy.rsiThreshold,
  })} -->
  <block type="trade_definition" id="td_root" deletable="false" x="0" y="0">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_market" id="td_market" deletable="false" movable="false">
        <field name="MARKET_LIST">${strategy.market}</field>
        <field name="SYMBOL_LIST">${strategy.symbol}</field>
        <next>
          <block type="trade_definition_tradetype" id="td_tradetype" deletable="false" movable="false">
            <field name="TRADETYPE_LIST">${strategy.tradeType}</field>
            <next>
              <block type="trade_definition_contracttype" id="td_contract" deletable="false" movable="false">
                <field name="TYPE_LIST">${strategy.contractDirection}</field>
                <next>
                  <block type="trade_definition_candleinterval" id="td_candle" deletable="false" movable="false">
                    <field name="CANDLEINTERVAL_LIST">${strategy.candleInterval}</field>
                    <next>
                      <block type="trade_definition_restartonerror" id="td_restart" deletable="false" movable="false">
                        <field name="RESTARTONERROR">${strategy.restartOnError ? 'TRUE' : 'FALSE'}</field>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="SUBMARKET">
      <block type="trade_definition_tradeoptions" id="td_options">
        <field name="DURATIONTYPE_LIST">${strategy.durationUnit}</field>
        <value name="DURATION">
          <shadow type="math_number"><field name="NUM">${strategy.duration}</field></shadow>
        </value>
        <value name="AMOUNT">
          <shadow type="math_number"><field name="NUM">${strategy.initialStake}</field></shadow>
        </value>
        <value name="PREDICTION">
          <shadow type="math_number_positive"><field name="NUM">${strategy.prediction}</field></shadow>
        </value>
      </block>
    </statement>
  </block>
  <block type="before_purchase" id="bp_root" deletable="false" x="0" y="420">
    <statement name="BEFOREPURCHASE_STACK">
      <block type="purchase" id="bp_purchase">
        <field name="PURCHASE_LIST">${strategy.contractDirection === 'ALTERNATE' ? 'CALL' : strategy.contractDirection}</field>
      </block>
    </statement>
  </block>
  <block type="after_purchase" id="ap_root" deletable="false" x="520" y="0">
    <statement name="AFTERPURCHASE_STACK">
      <block type="trade_again" id="ap_again"></block>
    </statement>
  </block>
</xml>`;
}

/**
 * Parses any Deriv Bot Blockly XML file (both HopeLogic exports and standard Deriv DBot XMLs)
 */
export function parseDerivXmlToStrategy(xmlText: string, fileName: string): BotStrategyConfig {
  const cleanName = fileName.replace(/\.xml$/i, '').trim() || 'Imported XML Strategy';

  // 1. Check embedded HopeLogic metadata comment if available
  const metaMatch = xmlText.match(/<!--\s*HopeLogic Metadata:\s*(\{.*?\})\s*-->/);
  let meta: Partial<BotStrategyConfig> = {};
  if (metaMatch && metaMatch[1]) {
    try {
      meta = JSON.parse(metaMatch[1]);
    } catch {
      meta = {};
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML syntax. Please select a valid Deriv Bot (.xml) strategy file.');
  }

  const getField = (name: string): string | null => {
    const el = doc.querySelector(`field[name="${name}"]`);
    return el?.textContent?.trim() ?? null;
  };

  const symbolRaw = getField('SYMBOL_LIST') || '1HZ100V';
  const matchedSymbol =
    MARKET_SYMBOLS.find(s => s.symbol.toLowerCase() === symbolRaw.toLowerCase()) || MARKET_SYMBOLS[0];

  const purchaseTypeRaw = (getField('PURCHASE_LIST') || getField('TYPE_LIST') || 'CALL').toUpperCase();
  let tradeType: TradeTypeGroup = meta.tradeType || 'ups_downs';
  let contractDirection: ContractDirection = meta.contractDirection || 'CALL';

  if (!meta.tradeType) {
    if (purchaseTypeRaw === 'PUT') {
      tradeType = 'ups_downs';
      contractDirection = 'PUT';
    } else if (purchaseTypeRaw === 'DIGITEVEN' || purchaseTypeRaw === 'DIGITODD') {
      tradeType = 'digits_even_odd';
      contractDirection = purchaseTypeRaw as ContractDirection;
    } else if (purchaseTypeRaw === 'DIGITOVER' || purchaseTypeRaw === 'DIGITUNDER') {
      tradeType = 'digits_over_under';
      contractDirection = purchaseTypeRaw as ContractDirection;
    } else if (purchaseTypeRaw === 'DIGITMATCH' || purchaseTypeRaw === 'DIGITDIFF') {
      tradeType = 'digits_match_diff';
      contractDirection = purchaseTypeRaw as ContractDirection;
    } else if (purchaseTypeRaw === 'ACCU') {
      tradeType = 'accumulators';
      contractDirection = 'ACCU';
    }
  }

  // Extract numeric values from DURATION / AMOUNT blocks if present
  const readValueBlockNumber = (valName: string, fallback: number): number => {
    const valNode = doc.querySelector(`value[name="${valName}"] field[name="NUM"]`);
    if (valNode?.textContent) {
      const parsed = parseFloat(valNode.textContent);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    return fallback;
  };

  // Detect indicators or strategy keywords in XML blocks
  const xmlLower = xmlText.toLowerCase();
  let conditionType = meta.conditionType || DEFAULT_STRATEGY.conditionType;
  if (!meta.conditionType) {
    if (xmlLower.includes('rsi_statement') || xmlLower.includes('rsia_statement')) {
      conditionType = 'rsi_threshold';
    } else if (xmlLower.includes('sma_statement') || xmlLower.includes('ema_statement')) {
      conditionType = 'sma_cross';
    } else if (xmlLower.includes('bb_statement')) {
      conditionType = 'bollinger_breakout';
    } else if (xmlLower.includes('last_digit')) {
      conditionType = 'last_digit_streak';
    } else if (xmlLower.includes('is_candle_black')) {
      conditionType = 'candle_color';
    }
  }

  let strategySystem = meta.strategySystem || DEFAULT_STRATEGY.strategySystem;
  if (!meta.strategySystem) {
    if (xmlLower.includes('dalembert')) strategySystem = 'D_ALEMBERT';
    else if (xmlLower.includes('oscar')) strategySystem = 'OSCARS_GRIND';
    else if (xmlLower.includes('1-3-2-6') || xmlLower.includes('1_3_2_6')) strategySystem = 'STRATEGY_1_3_2_6';
    else if (xmlLower.includes('martingale')) strategySystem = 'MARTINGALE';
  }

  const durationUnitRaw = getField('DURATIONTYPE_LIST');
  const durationUnit: 't' | 's' | 'm' =
    durationUnitRaw === 's' || durationUnitRaw === 'm' ? durationUnitRaw : 't';

  return {
    ...DEFAULT_STRATEGY,
    ...meta,
    id: `imported-${Date.now()}`,
    name: meta.name || cleanName,
    saveType: 'local',
    updatedAt: Date.now(),
    market: matchedSymbol.market,
    symbol: matchedSymbol.symbol,
    tradeType,
    contractDirection,
    durationUnit,
    duration: readValueBlockNumber('DURATION', DEFAULT_STRATEGY.duration),
    initialStake: readValueBlockNumber('AMOUNT', DEFAULT_STRATEGY.initialStake),
    prediction: Math.min(9, Math.max(0, Math.round(readValueBlockNumber('PREDICTION', 4)))),
    conditionType,
    strategySystem,
  };
}
