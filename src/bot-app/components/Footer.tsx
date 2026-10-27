import React from 'react';
import { Maximize2, Sun, Moon, Wifi } from 'lucide-react';
import brandConfig from '../../../brand.config.json';
import { useBot } from '../context/BotContext';

export const Footer: React.FC = () => {
  const { isDark, toggleTheme, serverTimeEpoch, connectionState, latencyMs } = useBot();

  const enableThemeToggle = brandConfig.platform.footer?.enable_theme_toggle ?? true;

  const formattedUtc = new Date(serverTimeEpoch * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <footer
      className={`hidden md:flex h-8 border-t px-4 items-center justify-between text-[11px] select-none shrink-0 z-20 ${
        isDark
          ? 'bg-[#151717] border-[#262a2e] text-slate-400'
          : 'bg-white border-slate-200 text-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <Wifi
            className={`w-3.5 h-3.5 ${
              connectionState === 'connected'
                ? 'text-emerald-500'
                : connectionState === 'connecting'
                ? 'text-amber-400'
                : 'text-sky-500'
            }`}
          />
          <span>
            {connectionState === 'connected'
              ? `Network status: Online (${latencyMs}ms)`
              : connectionState === 'connecting'
              ? 'Connecting to Deriv WebSocket...'
              : 'Stream active (Simulated feed)'}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono">{formattedUtc} GMT</span>

        <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700" />

        {enableThemeToggle && (
          <>
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700" />
          </>
        )}

        <button
          type="button"
          onClick={toggleFullScreen}
          title="Toggle Fullscreen"
          className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
