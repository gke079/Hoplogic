# HopeLogic Trading Bot

A visual trading-bot strategy builder and automated execution platform powered by the live Deriv WebSocket API (`wss://ws.derivws.com/websockets/v3`). Built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- **Dashboard**: Quick access to load strategies from My Computer (`.xml` / `.json`), Sample Templates, or Quick Strategy presets, plus saved bots management with search and preview.
- **Visual Bot Builder**: Interactive 4-stage strategy block workspace (**1. Trade parameters**, **2. Purchase conditions**, **3. Sell conditions (optional)**, **4. Restart trading conditions**), categorized block toolbox, undo/redo history, zoom controls, Quick Strategy modal, and Deriv Bot `.xml` import/export.
- **Quick Strategies**: Pre-configured mathematical formulas and interactive forms for **Martingale**, **D'Alembert**, **Oscar's Grind**, **Reverse Martingale**, **Reverse D'Alembert**, and **1-3-2-6**.
- **Live Interactive Charts**: Real-time Deriv WebSocket tick and OHLC candle streaming across Synthetic Volatility, Jump, Crash/Boom, Forex, and Crypto symbols with SMA/EMA/Bollinger Bands overlays, RSI sub-chart, and Live Last-Digit Distribution histogram.
- **Automated Bot Execution & Run Panel**: Real-time tick/candle evaluation engine with contract lifecycle stepper, Summary metrics, Transactions ledger (CSV export), live Journal log, Demo `$10,000` balance reset, and optional Deriv API Token authorization.
- **Tutorials & Guides**: Interactive User Guides, onboarding walkthrough videos, and searchable FAQ knowledge base.
- **Branding & Theming**: Driven by `brand.config.json` (`HOPELOGIC`, `#3bf75a` primary brand accent, light/dark mode support).

## Getting Started

```bash
npm install
npm run dev
```

The development server listens on `http://0.0.0.0:3000`.

## Environment Variables (`.env.example`)

Copy `.env.example` to `.env` if you want to customize the Deriv App ID or optional integrations:

| Variable | Description |
|---|---|
| `VITE_DERIV_APP_ID` | Deriv WebSocket App ID (defaults to `1089` public endpoint). |
| `VITE_DERIV_APP_NAME` | Optional override for platform display name from `brand.config.json`. |
| `VITE_DERIV_ENV` | `production` or `staging` endpoint environment. |
| `VITE_GD_CLIENT_ID` / `VITE_GD_APP_ID` / `VITE_GD_API_KEY` | Optional Google Drive Picker credentials. |

## Production Build

```bash
npm run build
```

Outputs static assets to `dist/`.
