"use client";

import React, { useState, useEffect } from "react";
import { motion as motionElement, AnimatePresence as FramerAnimatePresence } from "framer-motion";
import { X, Search, SlidersHorizontal, Loader2, BookOpen } from "lucide-react";
import { searchBooks, Book } from "@/utils/books";
import BookCard from "./BookCard";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onBookClick: (book: Book) => void;
  onAddToList?: (book: Book, status: "reading" | "on_hold" | "finished") => Promise<void>;
  userBooksStatuses?: Record<string, "reading" | "on_hold" | "finished">;
}

const GENRES = [
  "Fiction", "Science", "History", "Biography", "Computers", 
  "Business", "Philosophy", "Psychology", "Poetry", "Drama"
];

const LANGUAGES = [
  { code: "", label: "Any Language" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" }
];

export default function SearchOverlay({
  isOpen,
  onClose,
  onBookClick,
  onAddToList,
  userBooksStatuses = {},
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Years options from 2026 back to 1980
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 47 }, (_, i) => String(currentYear - i));

  // Trigger search on query or filter changes
  useEffect(() => {
    if (!query.trim() && !selectedGenre && !author) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const books = await searchBooks(query, {
          genre: selectedGenre,
          author: author || undefined,
          year: year || undefined,
          language: language || undefined,
        });
        setResults(books);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      setResults([]);
    };
  }, [query, author, year, selectedGenre, language]);

  const resetFilters = () => {
    setQuery("");
    setAuthor("");
    setYear("");
    setSelectedGenre("");
    setLanguage("");
    setResults([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 150,
        damping: 15,
      },
    },
  };

  return (
    <FramerAnimatePresence>
      {isOpen && (
        <motionElement.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end bg-zinc-950/70 backdrop-blur-md"
        >
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          {/* Drawer Panel */}
          <motionElement.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="relative z-10 w-full max-w-2xl h-screen bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-rose-500" />
                <h2 className="text-xl font-bold text-zinc-100 font-serif">Advanced Book Search</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Controls */}
            <div className="p-6 border-b border-zinc-800 space-y-4 max-h-[45vh] overflow-y-auto no-scrollbar">
              {/* Search input */}
              <div className="flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 border border-zinc-800">
                <Search className="h-5 w-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Type book title keywords..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                  autoFocus
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
              </div>

              {/* Toggle filters */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-400 cursor-pointer"
                >
                  <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
                </button>
                {(query || author || year || selectedGenre || language) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Filters Expandable Panel */}
              <FramerAnimatePresence>
                {showFilters && (
                  <motionElement.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4 pt-2"
                  >
                    {/* Authors & Year */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Author</label>
                        <input
                          type="text"
                          placeholder="e.g. Frank Herbert"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Release Year</label>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                        >
                          <option value="">Any Year</option>
                          {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Genres category tags */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400">Genres</label>
                      <div className="flex flex-wrap gap-2">
                        {GENRES.map((genre) => (
                          <button
                            key={genre}
                            onClick={() => setSelectedGenre(selectedGenre === genre ? "" : genre)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                              selectedGenre === genre
                                ? "bg-rose-600 border-rose-500 text-white"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motionElement.div>
                )}
              </FramerAnimatePresence>
            </div>

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/20">
              {results.length > 0 ? (
                <motionElement.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-6 justify-items-center"
                >
                  {results.map((book) => (
                    <motionElement.div key={book.id} variants={itemVariants}>
                      <BookCard
                        book={book}
                        onBookClick={onBookClick}
                        onAddToList={onAddToList}
                        alreadyAdded={userBooksStatuses[book.id]}
                      />
                    </motionElement.div>
                  ))}
                </motionElement.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <BookOpen className="h-12 w-12 text-zinc-700" />
                  <div>
                    <h3 className="text-zinc-400 font-bold text-sm">No Results Found</h3>
                    <p className="text-zinc-600 text-xs mt-1">
                      Try adjusting your keywords, author names, or category tags.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motionElement.div>
        </motionElement.div>
      )}
    </FramerAnimatePresence>
  );
}
