import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, RotateCcw } from 'lucide-react';

const GRADE_POINTS = [
  { label: 'O (Outstanding — 10)', points: 10 },
  { label: 'A+ (Excellent — 9)', points: 9 },
  { label: 'A (Very Good — 8)', points: 8 },
  { label: 'B+ (Good — 7)', points: 7 },
  { label: 'B (Above Average — 6)', points: 6 },
  { label: 'C (Average — 5)', points: 5 },
  { label: 'P (Pass — 4)', points: 4 },
  { label: 'F (Fail — 0)', points: 0 }
];

const INITIAL_COURSES = [
  { id: 'c1', name: 'Data Structures & Algorithms', credits: 4, grade: 10 },
  { id: 'c2', name: 'Database Management Systems', credits: 4, grade: 9 },
  { id: 'c3', name: 'Operating Systems', credits: 3, grade: 9 },
  { id: 'c4', name: 'Computer Networks', credits: 3, grade: 8 },
  { id: 'c5', name: 'Algorithms Lab', credits: 2, grade: 10 }
];

const INITIAL_SEMESTERS = [
  { id: 's1', sem: 'Semester 1', sgpa: 8.85, credits: 20 },
  { id: 's2', sem: 'Semester 2', sgpa: 9.10, credits: 22 },
  { id: 's3', sem: 'Semester 3', sgpa: 9.25, credits: 21 }
];

/**
 * 10-Point Scale SGPA & CGPA Calculator (src/tools/CgpaCalculator.jsx)
 */
export default function CgpaCalculator({ notify }) {
  const [courses, setCourses] = useState(() => {
    try {
      const saved = localStorage.getItem('studyvault_sgpa_courses');
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [semesters, setSemesters] = useState(() => {
    try {
      const saved = localStorage.getItem('studyvault_cgpa_semesters');
      return saved ? JSON.parse(saved) : INITIAL_SEMESTERS;
    } catch {
      return INITIAL_SEMESTERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('studyvault_sgpa_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('studyvault_cgpa_semesters', JSON.stringify(semesters));
  }, [semesters]);

  // Calculate SGPA
  const totalCourseCredits = courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const weightedCoursePoints = courses.reduce(
    (sum, c) => sum + (Number(c.credits) || 0) * (Number(c.grade) || 0),
    0
  );
  const sgpa = totalCourseCredits > 0 ? (weightedCoursePoints / totalCourseCredits).toFixed(2) : '0.00';

  // Calculate Overall CGPA
  const totalSemCredits = semesters.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
  const weightedSemPoints = semesters.reduce(
    (sum, s) => sum + (Number(s.credits) || 0) * (Number(s.sgpa) || 0),
    0
  );
  const cgpa = totalSemCredits > 0 ? (weightedSemPoints / totalSemCredits).toFixed(2) : '0.00';

  const handleAddCourse = () => {
    setCourses((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        name: `CSE Subject ${prev.length + 1}`,
        credits: 3,
        grade: 9
      }
    ]);
  };

  const handlePushSgpaToCgpa = () => {
    const nextNum = semesters.length + 1;
    setSemesters((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        sem: `Semester ${nextNum}`,
        sgpa: Number(sgpa),
        credits: totalCourseCredits || 20
      }
    ]);
    if (notify) notify(`Added current SGPA (${sgpa}) to cumulative CGPA tracker.`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: SGPA Calculator */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              SGPA Calculator (10-Point Scale)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your semester subjects, credits, and expected grade points
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Calculated SGPA
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#2563EB] dark:text-blue-400">
              {sgpa}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {courses.map((course, idx) => (
            <div
              key={course.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800"
            >
              <div className="sm:col-span-6">
                <label className="sr-only">Subject {idx + 1} Name</label>
                <input
                  type="text"
                  value={course.name}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((c) => (c.id === course.id ? { ...c, name: e.target.value } : c))
                    )
                  }
                  placeholder="Subject name"
                  className="w-full px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="sr-only">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={course.credits}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((c) =>
                        c.id === course.id ? { ...c, credits: Number(e.target.value) } : c
                      )
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  title="Course Credits"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="sr-only">Grade</label>
                <select
                  value={course.grade}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((c) =>
                        c.id === course.id ? { ...c, grade: Number(e.target.value) } : c
                      )
                    )
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {GRADE_POINTS.map((g) => (
                    <option key={g.points} value={g.points}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCourses((prev) => prev.filter((c) => c.id !== course.id))}
                  aria-label="Remove course"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddCourse}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-slate-800 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>

            <button
              type="button"
              onClick={() => setCourses(INITIAL_COURSES)}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePushSgpaToCgpa}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Add SGPA ({sgpa}) to CGPA</span>
          </button>
        </div>
      </div>

      {/* Right: Cumulative CGPA Calculator */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cumulative CGPA
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              Weighted across {semesters.length} semesters ({totalSemCredits} total credits)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Overall CGPA
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-[#1E3A8A] dark:text-blue-400">
              {cgpa}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {semesters.map((sem) => (
            <div
              key={sem.id}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800"
            >
              <input
                type="text"
                value={sem.sem}
                onChange={(e) =>
                  setSemesters((prev) =>
                    prev.map((s) => (s.id === sem.id ? { ...s, sem: e.target.value } : s))
                  )
                }
                className="w-28 px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500">SGPA:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={sem.sgpa}
                  onChange={(e) =>
                    setSemesters((prev) =>
                      prev.map((s) =>
                        s.id === sem.id ? { ...s, sgpa: Number(e.target.value) } : s
                      )
                    )
                  }
                  className="w-16 px-2 py-1 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500">Cr:</label>
                <input
                  type="number"
                  min="1"
                  max="35"
                  value={sem.credits}
                  onChange={(e) =>
                    setSemesters((prev) =>
                      prev.map((s) =>
                        s.id === sem.id ? { ...s, credits: Number(e.target.value) } : s
                      )
                    )
                  }
                  className="w-14 px-2 py-1 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => setSemesters((prev) => prev.filter((s) => s.id !== sem.id))}
                aria-label="Delete semester row"
                className="p-1 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          <span>Equivalent Percentage: {(Number(cgpa) * 9.5).toFixed(1)}%</span>
          <button
            type="button"
            onClick={() =>
              setSemesters((prev) => [
                ...prev,
                {
                  id: `s-${Date.now()}`,
                  sem: `Semester ${prev.length + 1}`,
                  sgpa: 8.5,
                  credits: 20
                }
              ])
            }
            className="font-semibold text-[#2563EB] dark:text-blue-400 hover:underline"
          >
            + Add Semester Row
          </button>
        </div>
      </div>
    </div>
  );
}
