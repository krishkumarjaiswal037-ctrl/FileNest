import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, UploadCloud, ChevronDown, Check, Palette } from 'lucide-react';
import FileNestLogo from './FileNestLogo';

export const THEME_OPTIONS = [
  {
    id: 'white',
    label: 'White',
    description: 'Clean & minimalist',
    dotColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    badgeClass: 'bg-white border-slate-300 text-slate-800'
  },
  {
    id: 'darkblue',
    label: 'Dark Blue',
    description: 'Deep navy night mode',
    dotColor: '#1E3A8A',
    borderColor: '#3B82F6',
    badgeClass: 'bg-[#0F172A] border-blue-800 text-blue-200'
  },
  {
    id: 'skyblue',
    label: 'Sky Blue',
    description: 'Fresh & vibrant sky cyan',
    dotColor: '#0EA5E9',
    borderColor: '#38BDF8',
    badgeClass: 'bg-sky-500 border-sky-400 text-white'
  },
  {
    id: 'orange',
    label: 'Orange',
    description: 'Energetic warm sunset',
    dotColor: '#EA580C',
    borderColor: '#FB923C',
    badgeClass: 'bg-orange-500 border-orange-400 text-white'
  }
];

/**
 * Sticky Glassmorphism Navbar Component (src/components/Navbar.jsx)
 * Supports White, Dark Blue, Sky Blue, and Orange themes.
 */
export default function Navbar({
  theme = 'white',
  onThemeChange,
  darkMode = false,
  onToggleDarkMode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close theme menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Upload', to: '/upload' },
    { label: 'Library', to: '/library' },
    { label: 'Tools', to: '/tools' },
    { label: 'About Developer', to: '/about' }
  ];

  const currentTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  const handleSelectTheme = (themeId) => {
    if (onThemeChange) {
      onThemeChange(themeId);
    } else if (onToggleDarkMode) {
      onToggleDarkMode();
    }
    setThemeDropdownOpen(false);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Primary Top Bar: 3-Zone Contract */}
      <header className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
        {/* Zone 1: Brand Logo + Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#1E3A8A] dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded group"
        >
          <FileNestLogo className="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs rounded-lg" />
          <span>
            File<span className="text-[#2563EB] dark:text-blue-400">Nest</span>
          </span>
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 dark:border-blue-400 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-[#1E3A8A] dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Actions + 4-Color Theme Selector */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Theme Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setThemeDropdownOpen((prev) => !prev)}
              aria-label={`Theme: ${currentTheme.label}. Click to select White, Dark Blue, Sky Blue, or Orange`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#2563EB] bg-slate-100/90 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <span
                className="w-3 h-3 rounded-full border shadow-2xs shrink-0"
                style={{
                  backgroundColor: currentTheme.dotColor,
                  borderColor: currentTheme.borderColor
                }}
              />
              <span className="hidden sm:inline">{currentTheme.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Popover */}
            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Theme
                </div>
                {THEME_OPTIONS.map((opt) => {
                  const isActive = opt.id === theme;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectTheme(opt.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#EFF6FF] dark:bg-blue-950/70 text-[#2563EB] dark:text-blue-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                          style={{
                            backgroundColor: opt.dotColor,
                            borderColor: opt.borderColor
                          }}
                        />
                        <span>{opt.label}</span>
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/upload"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl shadow-xs transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            <span>Upload Notes</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-5 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* Mobile Theme Pills (White, Dark Blue, Sky Blue, Orange) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
              Color Theme:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const isActive = opt.id === theme;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectTheme(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      isActive
                        ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-950/80 text-[#2563EB] dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border shrink-0"
                      style={{
                        backgroundColor: opt.dotColor,
                        borderColor: opt.borderColor
                      }}
                    />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <Link
              to="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors mt-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Notes</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
