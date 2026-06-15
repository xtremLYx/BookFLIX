"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, BookOpen, Plus, Check, Calendar, User } from "lucide-react";
import { Book } from "@/utils/books";
import BookCoverPlaceholder from "./BookCoverPlaceholder";
import BookComments from "./BookComments";

interface BookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToList?: (book: Book, status: "reading" | "on_hold" | "finished") => Promise<void>;
  alreadyAdded?: "reading" | "on_hold" | "finished";
  userId?: string;
}

export default function BookModal({
  book,
  isOpen,
  onClose,
  onAddToList,
  alreadyAdded,
  userId,
}: BookModalProps) {
  const [addingStatus, setAddingStatus] = useState<string | null>(null);
  const [prevBookId, setPrevBookId] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  if (book && book.id !== prevBookId) {
    setPrevBookId(book.id);
    setImgError(false);
  }

  if (!book) return null;

  const handleStatusChange = async (status: "reading" | "on_hold" | "finished") => {
    if (!onAddToList) return;
    setAddingStatus(status);
    await onAddToList(book, status);
    setAddingStatus(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 rounded-full bg-zinc-950/60 p-2 text-zinc-400 hover:bg-zinc-950 hover:text-white transition-colors cursor-pointer border border-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Cover Column */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative aspect-[2/3] w-48 sm:w-full rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                  {imgError || !book.coverUrl || book.coverUrl.includes("9780141439518") ? (
                    <BookCoverPlaceholder title={book.title} authors={book.authors} />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  )}
                </div>
              </div>

              {/* Info Column */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Category & Rating */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded bg-rose-600/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-500 uppercase tracking-wide">
                      {book.categories.join(", ")}
                    </span>
                    
                    {book.averageRating ? (
                      <div className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{book.averageRating} Rating</span>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs font-medium">Unrated</span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-zinc-100 leading-tight">
                    {book.title}
                  </h2>

                  {/* Author & Publisher */}
                  <div className="space-y-1.5 text-sm text-zinc-300">
                    <p className="flex items-center gap-1.5 font-medium">
                      <User className="h-4 w-4 text-zinc-500" />
                      <span>{book.authors.join(", ")}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Calendar className="h-4 w-4 text-zinc-600" />
                      <span>
                        Published by {book.publisher} ({book.publishedDate})
                      </span>
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Synopsis</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                      {book.description}
                    </p>
                  </div>

                  {/* Community Reviews */}
                  <div className="space-y-1 pt-2 border-t border-zinc-800">
                    <BookComments bookId={book.id} userId={userId} />
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-zinc-800 flex flex-wrap gap-4 items-center justify-between">
                  {/* Status Options */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-500 block uppercase tracking-wider">
                      Tracking Status
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(["reading", "on_hold", "finished"] as const).map((status) => {
                        const active = alreadyAdded === status;
                        return (
                          <button
                            key={status}
                            disabled={addingStatus !== null}
                            onClick={() => handleStatusChange(status)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold capitalize border transition-all cursor-pointer flex items-center gap-1.5 ${
                              active
                                ? "bg-rose-600 border-rose-500 text-white"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                            }`}
                          >
                            {active ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            <span>{status.replace("_", " ")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview Button */}
                  {book.previewLink && (
                    <button
                      onClick={() => window.open(book.previewLink, "_blank")}
                      className="flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-5 py-2.5 text-xs font-bold transition-all shadow-md self-end cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Read Preview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
