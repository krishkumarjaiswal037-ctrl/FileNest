import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';

const DEFAULT_EXAMS = [
  {
    id: 'ex-1',
    subject: 'Operating Systems (CS401)',
    examType: 'Mid-Semester Exam',
    date: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    syllabus: 'Units 1, 2 & Process Synchronization'
  },
  {
    id: 'ex-2',
    subject: 'Database Management Systems (CS302)',
    examType: 'Practical Lab Viva',
    date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    syllabus: 'SQL Queries, Triggers, PL/SQL & Normalization'
  },
  {
    id: 'ex-3',
    subject: 'Design & Analysis of Algorithms (CS403)',
    examType: 'End-Semester Theory',
    date: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
    syllabus: 'Full Syllabus (Units 1 to 5)'
  }
];

/**
 * Exam Countdown Tracker (src/tools/ExamCountdown.jsx)
 */
export default function ExamCountdown({ notify }) {
  const [exams, setExams] = useState(() => {
    try {
      const saved = localStorage.getItem('studyvault_exam_countdown');
      return saved ? JSON.parse(saved) : DEFAULT_EXAMS;
    } catch {
      return DEFAULT_EXAMS;
    }
  });

  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('End-Semester Theory');
  const [date, setDate] = useState('');
  const [syllabus, setSyllabus] = useState('');

  useEffect(() => {
    localStorage.setItem('studyvault_exam_countdown', JSON.stringify(exams));
  }, [exams]);

  const handleAddExam = (e) => {
    e.preventDefault();
    if (!subject.trim() || !date) return;

    setExams((prev) =>
      [
        ...prev,
        {
          id: `ex-${Date.now()}`,
          subject: subject.trim(),
          examType,
          date,
          syllabus: syllabus.trim() || 'Core Units'
        }
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );

    setSubject('');
    setDate('');
    setSyllabus('');
    if (notify) notify(`Added exam countdown for ${subject.trim()}.`, 'success');
  };

  const getDaysRemaining = (targetDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / 86400000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form to Add Exam */}
      <form
        onSubmit={handleAddExam}
        className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4"
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Schedule Exam Countdown
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Subject Name &amp; Code *
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Computer Networks (CS402)"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Assessment Type
          </label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="Mid-Semester Exam">Mid-Semester Exam</option>
            <option value="End-Semester Theory">End-Semester Theory</option>
            <option value="Practical Lab Viva">Practical Lab Viva</option>
            <option value="Quiz / Internal Test">Quiz / Internal Test</option>
            <option value="GATE / Placement OA">GATE / Placement OA</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Exam Date *
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Syllabus / Modules Covered
          </label>
          <input
            type="text"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
            placeholder="e.g. Units 1 to 3, TCP/IP & Routing"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exam to Tracker</span>
        </button>
      </form>

      {/* Countdown Cards */}
      <div className="lg:col-span-8 space-y-3.5">
        {exams.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
            <Calendar className="w-10 h-10 text-[#2563EB] mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              No Upcoming Exams Scheduled
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add your mid-sem, end-sem, or lab viva dates on the left to track remaining study days.
            </p>
          </div>
        ) : (
          exams.map((exam) => {
            const daysLeft = getDaysRemaining(exam.date);
            const isPast = daysLeft < 0;
            const isUrgent = daysLeft >= 0 && daysLeft <= 7;

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    <span className="font-semibold text-[#2563EB] dark:text-blue-400">
                      {exam.examType}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.date}</span>
                  </div>

                  <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {exam.subject}
                  </h4>

                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Syllabus: {exam.syllabus}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1.5 text-xl font-bold font-mono tabular-nums ${
                        isPast
                          ? 'text-slate-400'
                          : isUrgent
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#2563EB] dark:text-blue-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>
                        {isPast
                          ? 'Completed'
                          : daysLeft === 0
                          ? 'Today!'
                          : `${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'} Left`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isUrgent ? 'High priority revision window' : 'Scheduled assessment'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExams((prev) => prev.filter((e) => e.id !== exam.id))}
                    aria-label={`Remove ${exam.subject}`}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
