import React from 'react';

/**
 * FileNest Logo Component (src/components/FileNestLogo.jsx)
 * Distinctive brand emblem representing nested academic files cradled in a digital nest.
 */
export default function FileNestLogo({ className = 'w-8 h-8', showBadge = true }) {
  if (!showBadge) {
    return (
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fn-nobg-nest" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="fn-nobg-sheet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* Back nested sheet */}
        <rect
          x="7.5"
          y="6.5"
          width="13"
          height="17"
          rx="2.5"
          fill="#93C5FD"
          opacity="0.7"
          transform="rotate(-8 14 15)"
        />

        {/* Middle nested sheet */}
        <rect
          x="15.5"
          y="6.5"
          width="13"
          height="17"
          rx="2.5"
          fill="#60A5FA"
          opacity="0.85"
          transform="rotate(6 22 15)"
        />

        {/* Front main file sheet */}
        <path
          d="M11 8C11 6.89543 11.8954 6 13 6H20.5L25 10.5V22C25 23.1046 24.1046 24 23 24H13C11.8954 24 11 23.1046 11 22V8Z"
          fill="url(#fn-nobg-sheet)"
        />
        <path d="M20.5 6V10.5H25" fill="#93C5FD" />

        {/* File lines */}
        <line x1="14" y1="13" x2="20" y2="13" stroke="#EFF6FF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="16.5" x2="22" y2="16.5" stroke="#DBEAFE" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="20" x2="18" y2="20" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />

        {/* Nest Cradle */}
        <path
          d="M6 22C6 27.5 10.5 30.5 18 30.5C25.5 30.5 30 27.5 30 22"
          stroke="url(#fn-nobg-nest)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M10 25.5C13 27.8 23 27.8 26 25.5"
          stroke="#0284C7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fn-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="fn-nest-cradle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="50%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="fn-sheet-front" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F9FF" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Badge Base */}
      <rect width="36" height="36" rx="9" fill="url(#fn-grad-bg)" />

      {/* Back nested sheet */}
      <rect
        x="8.5"
        y="7.5"
        width="13"
        height="17"
        rx="2"
        fill="#93C5FD"
        opacity="0.6"
        transform="rotate(-8 15 16)"
      />

      {/* Middle nested sheet */}
      <rect
        x="14.5"
        y="7.5"
        width="13"
        height="17"
        rx="2"
        fill="#BAE6FD"
        opacity="0.75"
        transform="rotate(6 21 16)"
      />

      {/* Front main file sheet with folded corner */}
      <path
        d="M11 8.5C11 7.39543 11.8954 6.5 13 6.5H20.5L25 11V22C25 23.1046 24.1046 24 23 24H13C11.8954 24 11 23.1046 11 22V8.5Z"
        fill="url(#fn-sheet-front)"
      />
      <path d="M20.5 6.5V11H25" fill="#BFDBFE" />

      {/* Detail lines on front file */}
      <line x1="14" y1="13.5" x2="20" y2="13.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="16.5" x2="22" y2="16.5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="19.5" x2="18" y2="19.5" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />

      {/* Nest Cradle (protective arc holding the files) */}
      <path
        d="M6.5 22.5C6.5 27.5 10.8 30.5 18 30.5C25.2 30.5 29.5 27.5 29.5 22.5"
        stroke="url(#fn-nest-cradle)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Nest interior twig/weave curve */}
      <path
        d="M9.5 25.5C12.5 27.8 23.5 27.8 26.5 25.5"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}
