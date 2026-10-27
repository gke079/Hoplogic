import React, { useMemo, useState } from 'react';
import {
  Search,
  PlayCircle,
  BookOpen,
  HelpCircle,
  ChevronDown,
  Zap,
  X,
} from 'lucide-react';
import { useBot } from '../context/BotContext';
import {
  FAQ_ITEMS,
  QUICK_STRATEGIES,
  TUTORIAL_VIDEOS,
} from '../constants/markets-and-strategies';

export const TutorialsView: React.FC = () => {
  const { isDark, openQuickStrategy } = useBot();

  const [section, setSection] = useState<'guide' | 'strategies' | 'faq'>('guide');
  const [query, setQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeVideo, setActiveVideo] = useState<(typeof TUTORIAL_VIDEOS)[number] | null>(null);

  const qLower = query.trim().toLowerCase();

  const filteredVideos = useMemo(
    () =>
      TUTORIAL_VIDEOS.filter(
        v =>
          !qLower ||
          v.title.toLowerCase().includes(qLower) ||
          v.summary.toLowerCase().includes(qLower)
      ),
    [qLower]
  );

  const filteredStrategies = useMemo(
    () =>
      QUICK_STRATEGIES.filter(
        s =>
          !qLower ||
          s.label.toLowerCase().includes(qLower) ||
          s.tagline.toLowerCase().includes(qLower) ||
          s.description.some(d => d.toLowerCase().includes(qLower))
      ),
    [qLower]
  );

  const filteredFaqs = useMemo(
    () =>
      FAQ_ITEMS.filter(
        f =>
          !qLower ||
          f.q.toLowerCase().includes(qLower) ||
          f.a.toLowerCase().includes(qLower)
      ),
    [qLower]
  );

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-8 py-6">
      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Navigation + Search */}
        <aside className="lg:w-64 shrink-0 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search guides & FAQs..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#00a79e] ${
                isDark
                  ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
              }`}
            />
          </div>

          <nav
            className={`rounded-xl border p-2 space-y-1 ${
              isDark ? 'bg-[#181b1f] border-[#292f36]' : 'bg-white border-slate-200 shadow-2xs'
            }`}
          >
            {[
              { id: 'guide' as const, label: 'User Guide & Videos', icon: PlayCircle },
              { id: 'strategies' as const, label: 'Quick Strategy Guides', icon: BookOpen },
              { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
            ].map(item => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#00a79e] text-white'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Tutorial Content Area */}
        <div className="flex-1 space-y-6">
          {section === 'guide' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">Step-by-step Video Guides</h2>
                <p className="text-xs opacity-70 mt-0.5">
                  Watch interactive walkthroughs covering workspace blocks, risk controls, and live monitoring.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredVideos.map(vid => (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`group cursor-pointer rounded-xl border overflow-hidden transition-all hover:-translate-y-0.5 ${
                      isDark
                        ? 'bg-[#181b1f] border-[#292f36] hover:border-[#00a79e]'
                        : 'bg-white border-slate-200 hover:border-[#00a79e] shadow-xs'
                    }`}
                  >
                    <div className="relative h-40 bg-slate-900 overflow-hidden">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-[#00a79e] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <PlayCircle className="w-6 h-6" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-white font-mono text-[10px]">
                        {vid.duration}
                      </span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm leading-snug">{vid.title}</h3>
                      <p className="text-xs opacity-70 leading-relaxed">{vid.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'strategies' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Quick Strategy Reference</h2>
                <p className="text-xs opacity-70 mt-0.5">
                  Understand stake progression mechanics before deploying automated trading cycles.
                </p>
              </div>

              <div className="space-y-4">
                {filteredStrategies.map(qs => (
                  <div
                    key={qs.id}
                    className={`rounded-xl border p-5 flex flex-col md:flex-row gap-5 items-start ${
                      isDark
                        ? 'bg-[#181b1f] border-[#292f36]'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base">{qs.label}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#00a79e]/15 text-[#00a79e]">
                          {qs.riskLevel} Risk
                        </span>
                      </div>

                      {qs.description.map((p, i) => (
                        <p key={i} className="text-xs opacity-80 leading-relaxed">
                          {p}
                        </p>
                      ))}

                      <div
                        className={`p-2.5 rounded-lg border font-mono text-[11px] ${
                          isDark
                            ? 'bg-[#111417] border-[#262b33] text-emerald-400'
                            : 'bg-slate-50 border-slate-200 text-teal-800'
                        }`}
                      >
                        {qs.formulaSummary}
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => openQuickStrategy(qs.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00a79e] hover:bg-[#008f87] text-white text-xs font-bold transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Configure {qs.label}</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full md:w-56 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-3 flex items-center justify-center">
                      <img
                        src={qs.diagramUrl}
                        alt={qs.label}
                        className="max-h-40 object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'faq' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Frequently Asked Questions</h2>
                <p className="text-xs opacity-70 mt-0.5">
                  Answers to common questions about XML compatibility, market streams, and risk limits.
                </p>
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border overflow-hidden ${
                        isDark
                          ? 'bg-[#181b1f] border-[#292f36]'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isOpen ? 'rotate-180 text-[#00a79e]' : 'opacity-60'
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs opacity-80 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div
            className={`w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden ${
              isDark
                ? 'bg-[#181b1f] border-[#2d333b] text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">{activeVideo.title}</h3>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded hover:bg-slate-200/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black aspect-video flex items-center justify-center">
              <video
                src={activeVideo.videoSrc}
                poster={activeVideo.thumbnail}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 text-xs opacity-80">{activeVideo.summary}</div>
          </div>
        </div>
      )}
    </div>
  );
};
