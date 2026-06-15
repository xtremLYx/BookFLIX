"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  Search,
  Users,
  Sparkles,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import { searchBooks, Book } from "@/utils/books";

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreated: () => void;
}

export default function CreateClubModal({
  isOpen,
  onClose,
  userId,
  onCreated,
}: CreateClubModalProps) {
  const supabase = getSupabaseBrowserClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Book cover search
  const [bookQuery, setBookQuery] = useState("");
  const [bookSuggestions, setBookSuggestions] = useState<Book[]>([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [selectedCoverBook, setSelectedCoverBook] = useState<Book | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced book search
  useEffect(() => {
    if (!bookQuery.trim()) {
      setBookSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchingBooks(true);
      try {
        const results = await searchBooks(bookQuery.trim());
        setBookSuggestions(results.slice(0, 6));
      } catch {
        setBookSuggestions([]);
      } finally {
        setSearchingBooks(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [bookQuery]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setBookQuery("");
      setBookSuggestions([]);
      setSelectedCoverBook(null);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Club name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Create the club
      const { data: club, error: clubErr } = await supabase
        .from("book_clubs")
        .insert({
          name: name.trim(),
          description: description.trim(),
          cover_book_id: selectedCoverBook?.id || null,
          cover_book_title: selectedCoverBook?.title || null,
          cover_book_url: selectedCoverBook?.coverUrl || null,
          created_by: userId,
        })
        .select("id")
        .single();

      if (clubErr) throw clubErr;

      // 2. Add creator as admin member
      const { error: memberErr } = await supabase.from("club_members").insert({
        club_id: club.id,
        user_id: userId,
        role: "admin",
      });

      if (memberErr) throw memberErr;

      onCreated();
      onClose();
    } catch (err) {
      console.error("Error creating club:", err);
      setError("Failed to create club. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-rose-600/10 border border-rose-500/20">
                  <Users className="h-4 w-4 text-rose-500" />
                </div>
                <h2 className="text-lg font-bold text-zinc-100 font-serif">
                  Create a Book Club
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-zinc-950/60 p-2 text-zinc-400 hover:bg-zinc-950 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Club Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Club Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sci-Fi Explorers"
                  maxLength={80}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-600/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this club about? What kind of books will you discuss?"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-600/50 transition-colors resize-none"
                />
                <p className="text-[10px] text-zinc-700 text-right">
                  {description.length}/500
                </p>
              </div>

              {/* Cover Book Search */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Cover Book{" "}
                  <span className="text-zinc-600 normal-case font-normal">
                    (optional)
                  </span>
                </label>

                {selectedCoverBook ? (
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <div className="h-14 w-10 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                      {selectedCoverBook.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={selectedCoverBook.coverUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 truncate">
                        {selectedCoverBook.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {selectedCoverBook.authors.join(", ")}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCoverBook(null);
                        setBookQuery("");
                      }}
                      className="rounded-full p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-zinc-900 cursor-pointer transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center rounded-xl bg-zinc-950 border border-zinc-800 px-3">
                      <Search className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                      <input
                        type="text"
                        value={bookQuery}
                        onChange={(e) => setBookQuery(e.target.value)}
                        placeholder="Search for a book to use as cover..."
                        className="flex-1 bg-transparent py-2.5 px-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                      />
                      {searchingBooks && (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                      )}
                    </div>

                    {/* Suggestions dropdown */}
                    <AnimatePresence>
                      {bookSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden z-10 max-h-52 overflow-y-auto"
                        >
                          {bookSuggestions.map((book) => (
                            <button
                              key={book.id}
                              onClick={() => {
                                setSelectedCoverBook(book);
                                setBookQuery("");
                                setBookSuggestions([]);
                              }}
                              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-zinc-800/60 transition-colors cursor-pointer"
                            >
                              <div className="h-10 w-7 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                                {book.coverUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={book.coverUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-zinc-300 truncate">
                                  {book.title}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate">
                                  {book.authors.join(", ")}
                                </p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-xs text-rose-500 font-medium">{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-5 py-2.5 text-xs font-bold text-zinc-400 border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:text-zinc-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
                className="rounded-xl px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Create Club
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
