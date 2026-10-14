import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, ListTodo } from 'lucide-react';

const DEFAULT_TASKS = [
  {
    id: 't1',
    text: 'Solve 2024 & 2025 DBMS End-Semester PYQ Normalization questions',
    subject: 'DBMS',
    priority: 'High',
    completed: false
  },
  {
    id: 't2',
    text: 'Implement Dijkstra & Bellman-Ford in C++ for DAA Lab Record',
    subject: 'DAA',
    priority: 'High',
    completed: true
  },
  {
    id: 't3',
    text: 'Revise OS Deadlock Avoidance (Banker Algorithm) notes',
    subject: 'Operating Systems',
    priority: 'Medium',
    completed: false
  },
  {
    id: 't4',
    text: 'Upload scanned handwritten Graph Theory theorems to FileNest',
    subject: 'Discrete Maths',
    priority: 'Low',
    completed: false
  }
];

/**
 * Study Planner / To-Do List Component (src/tools/Planner.jsx)
 * Persisted in localStorage.
 */
export default function Planner({ notify }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('studyvault_study_planner');
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  const [taskInput, setTaskInput] = useState('');
  const [subjectTag, setSubjectTag] = useState('DSA');
  const [priority, setPriority] = useState('High');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('studyvault_study_planner', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        text: taskInput.trim(),
        subject: subjectTag.trim() || 'General',
        priority,
        completed: false
      },
      ...prev
    ]);
    setTaskInput('');
    if (notify) notify('Added study task to your planner.', 'success');
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Semester Study Planner &amp; Task Queue
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Completed {completedCount} of {tasks.length} study tasks
          </p>
        </div>

        {/* Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="Add a revision goal, assignment deadline, or lab record task..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="md:col-span-2">
          <input
            type="text"
            value={subjectTag}
            onChange={(e) => setSubjectTag(e.target.value)}
            placeholder="Subject tag"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="md:col-span-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full h-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="py-10 text-center">
          <ListTodo className="w-9 h-9 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No tasks in this view. Add a new study goal above!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex items-center justify-between gap-4 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className="flex items-start gap-3 text-left flex-1 min-w-0"
              >
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-[#2563EB] dark:text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.text}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {task.subject} · {task.priority} Priority
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                aria-label="Delete task"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
