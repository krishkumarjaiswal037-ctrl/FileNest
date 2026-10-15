import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  UploadCloud,
  ChevronDown,
  Check,
  Palette,
  Sun,
  Moon,
  SunMoon,
  Sparkles
} from 'lucide-react';
import FileNestLogo from './FileNestLogo';

export const THEME_OPTIONS = [
  {
    id: 'white',
    label: 'White',
    description: 'Clean & minimalist white theme',
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
  }
];

/**
 * Sticky Glassmorphism Navbar Component (src/components/Navbar.jsx)
 * Clean navigation bar with White & Dark Blue theme toggle, links, and Upload CTA.
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
    { label: 'AI Studio', to: '/ai', isAi: true }
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

  const handleToggleTwoThemes = (e) => {
    // If shift or secondary click, toggle immediately between the two colors; otherwise toggle menu
    setThemeDropdownOpen((prev) => !prev);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Primary Top Bar */}
      <header className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo + Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#1E3A8A] dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded group"
        >
          <FileNestLogo className="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs rounded-lg" />
          <span>
            File<span className="text-[#2563EB] dark:text-blue-400">Nest</span>
          </span>
        </Link>

        {/* Navigation Links (Admin removed from navbar, preserved in footer) */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 dark:border-blue-400 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-[#1E3A8A] dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`
              }
            >
              {item.isAi && <Sparkles className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 animate-pulse" />}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Side: Theme Selector & Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Dedicated 2-Color Theme Switcher (White & Dark Blue) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleToggleTwoThemes}
              aria-label={`Switch color theme. Current theme: ${currentTheme.label} (White or Dark Blue)`}
              aria-expanded={themeDropdownOpen}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#2563EB] bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-98"
            >
              {/* Theme Icon */}
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/70 text-[#2563EB] dark:text-blue-400 group-hover:scale-110 transition-transform">
                <SunMoon className="w-3.5 h-3.5 shrink-0" />
              </div>

              {/* Theme Name */}
              <span className="hidden sm:inline font-medium">
                {currentTheme.label}
              </span>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  themeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Theme Dropdown Menu */}
            {themeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                  Color Theme
                </div>
                <div className="space-y-1">
                  {THEME_OPTIONS.map((opt) => {
                    const isActive = opt.id === theme;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectTheme(opt.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                          isActive
                            ? 'bg-[#EFF6FF] dark:bg-blue-950/70 text-[#1E3A8A] dark:text-blue-200 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                            style={{
                              backgroundColor: opt.dotColor,
                              borderColor: opt.borderColor
                            }}
                          />
                          <span>{opt.label}</span>
                        </div>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Upload Notes CTA Button */}
          <Link
            to="/upload"
            className="group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm transition-all duration-200 active:scale-95 hover:shadow-md hover:shadow-blue-500/25 overflow-hidden"
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
            <span className="hidden sm:inline">Upload Notes</span>
            <span className="sm:hidden">Upload</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse ml-0.5 hidden sm:inline-block" />
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-[#2563EB] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-4">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/70 text-[#2563EB] dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  {item.isAi && <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-blue-400" />}
                  <span>{item.label}</span>
                </div>
                {item.isAi && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-300">
                    Gemini &amp; Veo
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Theme Switcher */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Color Theme
            </div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((opt) => {
                const isActive = opt.id === theme;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      handleSelectTheme(opt.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isActive
                        ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-950 text-[#1E3A8A] dark:text-blue-200 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border shadow-2xs shrink-0"
                      style={{
                        backgroundColor: opt.dotColor,
                        borderColor: opt.borderColor
                      }}
                    />
                    <span>{opt.label}</span>
                    {isActive && <Check className="w-3 h-3 text-[#2563EB] dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Upload CTA */}
          <div className="pt-2">
            <Link
              to="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm transition-colors"
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
