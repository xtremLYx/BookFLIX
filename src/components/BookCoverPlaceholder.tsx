"use client";

import React from "react";
import { BookOpen } from "lucide-react";

interface BookCoverPlaceholderProps {
  title: string;
  authors?: string[];
  className?: string;
  mini?: boolean;
}

// Generate a nice gradient background based on a hash of the title
const getGradientClass = (title: string) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 5;
  const gradients = [
    "from-rose-950 to-zinc-950",
    "from-indigo-950 to-zinc-950",
    "from-emerald-950 to-zinc-950",
    "from-amber-950 to-zinc-950",
    "from-violet-950 to-zinc-950",
  ];
  return gradients[index];
};

export default function BookCoverPlaceholder({
  title,
  authors = [],
  className = "",
  mini = false,
}: BookCoverPlaceholderProps) {
  const authorName = authors.length > 0 ? authors[0] : "Unknown Author";
  const bgGradient = getGradientClass(title);

  if (mini) {
    return (
      <div
        className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br ${bgGradient} border border-zinc-850 rounded select-none ${className}`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-black/40" />
        <span className="font-serif text-[8px] font-bold text-zinc-300 tracking-wider uppercase text-center px-0.5 truncate max-w-full">
          {title.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br ${bgGradient} border border-zinc-850 rounded-lg select-none ${className}`}
    >
      {/* Spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/40 border-r border-white/5 shadow-inner" />

      {/* Top Section: Icon */}
      <div className="flex justify-end opacity-20 pr-1">
        <BookOpen className="h-4 w-4 text-white" />
      </div>

      {/* Center Section: Title */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-1">
        <span className="font-serif text-[11px] sm:text-xs md:text-sm font-bold text-zinc-100 line-clamp-4 leading-snug tracking-wide uppercase px-2">
          {title}
        </span>
      </div>

      {/* Bottom Section: Author */}
      <div className="text-center pt-2 border-t border-white/5 opacity-50 pl-2">
        <span className="block text-[9px] sm:text-[10px] font-medium text-zinc-300 truncate">
          {authorName}
        </span>
      </div>
    </div>
  );
}
