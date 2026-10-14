import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const MODES = {
  focus: { label: 'Focus Session (25m)', seconds: 25 * 60 },
  shortBreak: { label: 'Short Break (5m)', seconds: 5 * 60 },
  longBreak: { label: 'Long Break (15m)', seconds: 15 * 60 }
};

/**
 * Pomodoro 25/5 Study Timer Component (src/tools/Pomodoro.jsx)
 */
export default function Pomodoro({ notify }) {
  const [mode, setMode] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(() => {
    return Number(localStorage.getItem('studyvault_pomodoro_sessions') || 0);
  });

  useEffect(() => {
    if (!isRunning) return undefined;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (mode === 'focus') {
            setCompletedSessions((c) => {
              const next = c + 1;
              localStorage.setItem('studyvault_pomodoro_sessions', String(next));
              return next;
            });
            if (notify) notify('25-minute Focus Session complete! Time for a 5-minute break.', 'success');
          } else if (notify) {
            notify('Break finished! Ready for your next focus block.', 'info');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, notify]);

  const switchMode = (nextMode) => {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(MODES[nextMode].seconds);
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');
  const totalSeconds = MODES[mode].seconds;
  const progressPct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs max-w-2xl mx-auto text-center">
      {/* Mode Switcher */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {Object.entries(MODES).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchMode(key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              mode === key
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Digital Monospace Timer Readout */}
      <div className="my-8">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-[#2563EB] dark:text-blue-400 mb-2">
          {mode === 'focus' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
          <span>{mode === 'focus' ? 'Deep Study Mode Active' : 'Recovery Break'}</span>
        </div>

        <div className="text-6xl sm:text-7xl font-bold font-mono tabular-nums tracking-tight text-[#1E3A8A] dark:text-white">
          {minutes}:{seconds}
        </div>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mt-6 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#2563EB] h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Timer Action Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setIsRunning((r) => !r)}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl shadow-xs transition-colors"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause Timer</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Start Timer</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSecondsLeft(MODES[mode].seconds);
          }}
          className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
        Completed Pomodoro Focus Blocks: <strong className="text-slate-900 dark:text-white">{completedSessions}</strong> ({completedSessions * 25} mins focused)
      </div>
    </div>
  );
}
