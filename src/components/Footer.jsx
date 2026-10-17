import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Instagram, ExternalLink, ShieldCheck } from 'lucide-react';
import FileNestLogo from './FileNestLogo';
import developerConfig from '../data/developer';
import { getAdminSession } from '../lib/adminAuth';

/**
 * Footer Component (src/components/Footer.jsx)
 * Displays short description, quick navigation links, developer attribution,
 * and copyright year.
 */
export default function Footer({ onOpenSqlModal }) {
  const currentYear = new Date().getFullYear();
  const session = getAdminSession();

  return (
    <footer className="bg-slate-50 dark:bg-[#0F172A] border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200 dark:border-slate-800">
          {/* Column 1: Brand & Description */}
          <div className="md:col-span-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#1E3A8A] dark:text-white group"
            >
              <FileNestLogo className="w-7 h-7 shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs rounded-lg" />
              <span>
                File<span className="text-[#2563EB] dark:text-blue-400">Nest</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              A dedicated academic document repository and engineering toolkit crafted for B.Tech
              Computer Science &amp; Engineering students to organize PDFs, handwritten
              notes, and exam preparation semester-wise.
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 dark:text-white uppercase">
              Workspace Links
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  Upload PDFs &amp; Photos
                </Link>
              </li>
              <li>
                <Link to="/library" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  Semester Library (Sem 1–8)
                </Link>
              </li>
              <li>
                <Link to="/tools" className="hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors">
                  Smart CSE Tools &amp; CGPA
                </Link>
              </li>
              <li className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${session ? 'bg-emerald-500 animate-pulse' : 'bg-[#2563EB]'}`} />
                  <span>
                    {session ? `Admin Dashboard (${session.username})` : 'Admin Portal (Log in / Sign up)'}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer Contact */}
          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 dark:text-white uppercase">
              Developer &amp; Repository
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {developerConfig.name} · {developerConfig.role}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {developerConfig.college}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <a
                href={developerConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer GitHub"
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={developerConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer LinkedIn"
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={developerConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer Instagram"
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={developerConfig.socials.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Developer Portfolio"
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            Developed by <span className="font-semibold text-slate-800 dark:text-slate-200">{developerConfig.name}</span>
          </p>
          <p className="tabular-nums">
            &copy; {currentYear} FileNest · B.Tech CSE Academic Repository. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
