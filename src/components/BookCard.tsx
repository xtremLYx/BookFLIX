"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Check, Play } from "lucide-react";
import { Book } from "@/utils/books";
import BookCoverPlaceholder from "./BookCoverPlaceholder";

interface BookCardProps {
  book: Book;
  onBookClick: (book: Book) => void;
  onAddToList?: (book: Book, status: "reading" | "on_hold" | "finished") => Promise<void>;
  alreadyAdded?: "reading" | "on_hold" | "finished";
}

export default function BookCard({ book, onBookClick, onAddToList, alreadyAdded }: BookCardProps) {
  const [hovered, setHovered] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [addingStatus, setAddingStatus] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleStatusSelect = async (e: React.MouseEvent, status: "reading" | "on_hold" | "finished") => {
    e.stopPropagation();
    if (!onAddToList) return;
    
    setAddingStatus(status);
    await onAddToList(book, status);
    setAddingStatus(null);
    setShowStatusMenu(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowStatusMenu(false);
      }}
      className="relative flex-none w-[140px] sm:w-[180px] aspect-[2/3] cursor-pointer rounded-lg bg-zinc-900 group"
      onClick={() => onBookClick(book)}
    >
      {/* Book Cover */}
      <div className="absolute inset-0 w-full h-full overflow-hidden rounded-lg border border-zinc-800 transition-all duration-300 group-hover:border-zinc-700">
        {imgError || !book.coverUrl || book.coverUrl.includes("9780141439518") ? (
          <BookCoverPlaceholder title={book.title} authors={book.authors} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={book.coverUrl}
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        
        {/* Already Added Badge */}
        {alreadyAdded && (
          <div className="absolute top-2 right-2 rounded-full bg-rose-600 p-1 text-white shadow-lg border border-rose-500">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Netflix Hover Overlay */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 5 }}
            animate={{ scale: 1.15, opacity: 1, y: -10 }}
            exit={{ scale: 0.95, opacity: 0, y: 5 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute -inset-x-4 -inset-y-4 z-20 flex flex-col justify-end rounded-xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top half: Cover Thumbnail with Play/Read button */}
            {imgError || !book.coverUrl || book.coverUrl.includes("9780141439518") ? (
              <div 
                className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-zinc-800 mb-3"
                onClick={() => onBookClick(book)}
              >
                <BookCoverPlaceholder title={book.title} authors={book.authors} className="!rounded-none border-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-2 left-2 flex items-center justify-center h-8 w-8 rounded-full bg-rose-600 text-white shadow hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              </div>
            ) : (
              <div 
                className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-cover bg-center border border-zinc-800 mb-3"
                style={{ backgroundImage: `url(${book.coverUrl})` }}
                onClick={() => onBookClick(book)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-2 left-2 flex items-center justify-center h-8 w-8 rounded-full bg-rose-600 text-white shadow hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </div>
              </div>
            )}

            {/* Bottom half: Metadata and Action items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="truncate text-sm font-bold text-zinc-100 pr-2 leading-snug w-[80%]" title={book.title}>
                  {book.title}
                </h4>
                
                {/* Add To List Button */}
                {onAddToList && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusMenu(!showStatusMenu);
                      }}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all cursor-pointer ${
                        alreadyAdded
                          ? "border-rose-500 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          : "border-zinc-600 text-zinc-300 hover:border-zinc-200 hover:text-white"
                      }`}
                    >
                      <Plus className={`h-3.5 w-3.5 transition-transform ${showStatusMenu ? "rotate-45" : ""}`} />
                    </button>

                    {/* Dropdown status selector */}
                    <AnimatePresence>
                      {showStatusMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 5 }}
                          className="absolute right-0 bottom-8 z-30 w-32 rounded-lg border border-zinc-800 bg-zinc-900 p-1 shadow-xl"
                        >
                          {(["reading", "on_hold", "finished"] as const).map((status) => (
                            <button
                              key={status}
                              disabled={addingStatus !== null}
                              onClick={(e) => handleStatusSelect(e, status)}
                              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] font-semibold capitalize transition-colors hover:bg-zinc-800 cursor-pointer ${
                                alreadyAdded === status ? "text-rose-500" : "text-zinc-300"
                              }`}
                            >
                              <span>{status.replace("_", " ")}</span>
                              {alreadyAdded === status && <Check className="h-3 w-3" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Author & Year */}
              <p className="truncate text-[11px] text-zinc-400">
                {book.authors[0]} • {book.publishedDate.substring(0, 4)}
              </p>

              {/* Rating and Genre */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-rose-400 font-bold uppercase tracking-wider">
                  {book.categories[0]?.split(" ")[0] || "General"}
                </span>

                {book.averageRating ? (
                  <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{book.averageRating}</span>
                  </div>
                ) : (
                  <span className="text-zinc-500 font-medium">Unrated</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
