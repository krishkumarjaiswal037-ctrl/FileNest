import React, { useState } from 'react';
import {
  Github,
  Linkedin,
  Instagram,
  ExternalLink,
  GraduationCap,
  MapPin,
  FolderGit2,
  Building2,
  BookOpen
} from 'lucide-react';
import developerConfig from '../data/developer';

/**
 * About Developer Page (src/pages/About.jsx)
 * Displays Krish Kumar Jaiswal's personal profile, bio, projects, and academic background.
 */
export default function About() {
  const [imgFailed, setImgFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const initials = developerConfig.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Main Developer Profile Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Top Cover Banner Photo */}
        <div className="relative h-44 sm:h-64 w-full bg-slate-900 overflow-hidden">
          {developerConfig.coverUrl && !coverFailed ? (
            <img
              src={developerConfig.coverUrl}
              alt="Krish Jaiswal Cover Banner"
              referrerPolicy="no-referrer"
              onError={() => setCoverFailed(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB]" />
          )}
        </div>

        <div className="px-6 sm:px-10 pb-8">
          {/* Avatar + Primary Identity */}
          <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-4 border-white dark:border-slate-900 bg-[#EFF6FF] dark:bg-slate-800 shadow-lg overflow-hidden flex items-center justify-center shrink-0">
                {developerConfig.photoUrl && !imgFailed ? (
                  <img
                    src={developerConfig.photoUrl}
                    alt={`${developerConfig.name} profile portrait`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <span className="text-3xl font-bold text-[#1E3A8A] dark:text-blue-400">
                    {initials}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight whitespace-nowrap text-nowrap developer-name-gradient inline-block transform transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:drop-shadow-[0_8px_20px_rgba(37,99,235,0.35)] cursor-pointer">
                  {developerConfig.name}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {developerConfig.role}
                </p>
              </div>
            </div>

            {/* Social Action Links (Contact link removed) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={developerConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>

              <a
                href={developerConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>

              <a
                href={developerConfig.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-[#EFF6FF] hover:text-[#2563EB] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </a>

              <a
                href={developerConfig.socials.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Portfolio</span>
              </a>
            </div>
          </div>

          {/* Bio & Academic Details */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              {/* About Me Section */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  About Developer
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {developerConfig.bio}
                </p>
              </div>

              {/* My Projects Section (Replaces Core Technical Stack) */}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-[#2563EB]" />
                  <span>My Projects</span>
                </h2>

                <div className="mt-3 space-y-3">
                  {developerConfig.projects.map((project, idx) => (
                    <a
                      key={project.name}
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-blue-500 hover:bg-[#EFF6FF]/50 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-blue-400">
                            0{idx + 1}.
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </h3>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] shrink-0 transition-colors" />
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {project.description}
                      </p>
                      <p className="mt-2 font-mono text-xs text-[#2563EB] dark:text-blue-400 truncate">
                        {project.url}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Academic Profile Table (CGPA removed) */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-700">
                <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                <span>Academic Profile</span>
              </div>

              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>University Education</span>
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {developerConfig.college}
                  </dd>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>High School Education</span>
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {developerConfig.highSchool}
                  </dd>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <dt className="text-slate-500 dark:text-slate-400">Degree &amp; Branch</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {developerConfig.branch}
                  </dd>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <dt className="text-slate-500 dark:text-slate-400">Origin / Address</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white mt-0.5 inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{developerConfig.hometown}</span>
                  </dd>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <dt className="text-slate-500 dark:text-slate-400">Portfolio Website</dt>
                  <dd className="mt-1">
                    <a
                      href={developerConfig.socials.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#2563EB] dark:text-blue-400 hover:underline"
                    >
                      <span>krishtech.vercel.app</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
