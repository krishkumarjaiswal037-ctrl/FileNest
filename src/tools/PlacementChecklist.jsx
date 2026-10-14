import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, RotateCcw } from 'lucide-react';
import { DEFAULT_PLACEMENT_CHECKLIST } from '../data/subjects';

const CATEGORIES = ['All', 'DSA', 'OS', 'DBMS', 'CN', 'OOPs', 'Aptitude'];

/**
 * Placement Prep Checklist Component (src/tools/PlacementChecklist.jsx)
 * Tracks DSA, OS, DBMS, CN, OOPs, and Aptitude readiness with progress bar.
 */
export default function PlacementChecklist() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('studyvault_placement_checklist');
      return saved ? JSON.parse(saved) : DEFAULT_PLACEMENT_CHECKLIST;
    } catch {
      return DEFAULT_PLACEMENT_CHECKLIST;
    }
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [newTopic, setNewTopic] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('DSA');

  useEffect(() => {
    localStorage.setItem('studyvault_placement_checklist', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `prep-${Date.now()}`,
        category: newTopicCategory,
        title: newTopic.trim(),
        completed: false
      }
    ]);
    setNewTopic('');
  };

  const completedCount = items.filter((i) => i.completed).length;
  const overallPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems =
    activeCategory === 'All'
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header & Overall Readiness Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            B.Tech CSE Placement &amp; Internship Prep Checklist
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
            Master core CS interview topics ({completedCount} of {items.length} topics completed)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold font-mono tabular-nums text-[#2563EB] dark:text-blue-400">
            {overallPct}%
          </span>
          <button
            type="button"
            onClick={() => setItems(DEFAULT_PLACEMENT_CHECKLIST)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title="Reset to default topics"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-[#2563EB] h-full transition-all duration-200"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === cat
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => toggleItem(item.id)}
            className="w-full p-4 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-start gap-3.5 transition-colors"
          >
            {item.completed ? (
              <CheckSquare className="w-5 h-5 text-[#2563EB] dark:text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  item.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {item.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Module: {item.category}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Add Custom Topic */}
      <form onSubmit={handleAddTopic} className="flex flex-col sm:flex-row gap-3 pt-2">
        <select
          value={newTopicCategory}
          onChange={(e) => setNewTopicCategory(e.target.value)}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
        >
          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Add a custom placement topic (e.g. Trie & Segment Trees)..."
          className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
        />

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Topic</span>
        </button>
      </form>
    </div>
  );
}
