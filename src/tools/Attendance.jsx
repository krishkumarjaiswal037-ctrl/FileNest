import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

const INITIAL_ATTENDANCE = [
  { id: 'att-1', subject: 'Operating Systems', attended: 28, total: 32 },
  { id: 'att-2', subject: 'Computer Networks', attended: 22, total: 30 },
  { id: 'att-3', subject: 'Design & Analysis of Algorithms', attended: 24, total: 27 },
  { id: 'att-4', subject: 'Software Engineering', attended: 19, total: 22 }
];

/**
 * 75% Attendance Criterion Tracker (src/tools/Attendance.jsx)
 * Calculates live attendance percentage and exact number of classes that can be
 * safely skipped (bunked) or must be attended consecutively to stay >= 75%.
 */
export default function Attendance() {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('studyvault_attendance_tracker');
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    localStorage.setItem('studyvault_attendance_tracker', JSON.stringify(records));
  }, [records]);

  const updateClassCount = (id, deltaAttended, deltaTotal) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextAttended = Math.max(0, r.attended + deltaAttended);
        const nextTotal = Math.max(nextAttended, r.total + deltaTotal);
        return { ...r, attended: nextAttended, total: nextTotal };
      })
    );
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setRecords((prev) => [
      ...prev,
      { id: `att-${Date.now()}`, subject: newSubject.trim(), attended: 1, total: 1 }
    ]);
    setNewSubject('');
  };

  /**
   * Calculate how many classes can be skipped while maintaining >= 75%,
   * OR how many consecutive classes must be attended to reach 75%.
   */
  const getAttendanceAdvisory = (attended, total) => {
    if (total === 0) return { status: 'safe', text: 'No classes conducted yet' };
    const pct = (attended / total) * 100;

    if (pct >= 75) {
      // attended / (total + x) >= 0.75 => total + x <= attended / 0.75 => x <= (4*attended - 3*total) / 3
      const maxSkips = Math.floor((4 * attended - 3 * total) / 3);
      return {
        status: 'safe',
        text:
          maxSkips > 0
            ? `Safe: You can skip ${maxSkips} upcoming ${maxSkips === 1 ? 'class' : 'classes'} and stay above 75%.`
            : 'On the 75% boundary: Do not skip the next class.'
      };
    }

    // (attended + y) / (total + y) >= 0.75 => 4*attended + 4y >= 3*total + 3y => y >= 3*total - 4*attended
    const needed = Math.ceil(3 * total - 4 * attended);
    return {
      status: 'shortage',
      text: `Shortage Alert: Attend next ${needed} consecutive ${needed === 1 ? 'class' : 'classes'} to reach 75%.`
    };
  };

  return (
    <div className="space-y-6">
      {/* Add Subject Bar */}
      <form
        onSubmit={handleAddSubject}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-xs"
      >
        <input
          type="text"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Add subject to track 75% attendance requirement..."
          className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </form>

      {/* Subject Attendance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((item) => {
          const pct = item.total > 0 ? ((item.attended / item.total) * 100).toFixed(1) : '0.0';
          const advisory = getAttendanceAdvisory(item.attended, item.total);
          const isSafe = Number(pct) >= 75;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                      Attended: {item.attended} / {item.total} lectures
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xl font-bold font-mono tabular-nums ${
                        isSafe
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {pct}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecords((prev) => prev.filter((r) => r.id !== item.id))}
                      aria-label={`Remove ${item.subject}`}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      isSafe ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(100, Number(pct))}%` }}
                  />
                </div>

                {/* Advisory Message with Explicit Icon */}
                <div
                  className={`mt-3 flex items-center gap-2 text-xs font-medium ${
                    isSafe
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {isSafe ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{advisory.text}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateClassCount(item.id, 1, 1)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    + Attended Today
                  </button>
                  <button
                    type="button"
                    onClick={() => updateClassCount(item.id, 0, 1)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    + Missed Class
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => updateClassCount(item.id, -1, -1)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Undo (-1)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
