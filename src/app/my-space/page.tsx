"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Pause, CheckCircle2, Trash2,
  BookOpen, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import { prefetchBookDetails, Book } from "@/utils/books";
import Navbar from "@/components/Navbar";
import BookModal from "@/components/BookModal";
import BookCoverPlaceholder from "@/components/BookCoverPlaceholder";

interface UserBook {
  id: string;
  google_book_id: string;
  title: string;
  author: string;
  cover_url: string;
  status: "reading" | "on_hold" | "finished";
  updated_at: string;
}

export default function MySpace() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<UserBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Load user data and tracking books
  useEffect(() => {
    async function loadSpaceData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setUser(session.user);

      try {
        const { data: userBooks, error } = await supabase
          .from("user_books")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setBooks(userBooks || []);
      } catch (err) {
        console.error("Error loading user books:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSpaceData();
  }, [router, supabase]);

  // Optimistically move a book's column
  const handleMoveBook = async (googleBookId: string, targetStatus: "reading" | "on_hold" | "finished") => {
    if (!user) return;

    const previousBooks = [...books];

    // Update local state instantly (Optimistic UI)
    setBooks((prev) =>
      prev.map((b) =>
        b.google_book_id === googleBookId
          ? { ...b, status: targetStatus, updated_at: new Date().toISOString() }
          : b
      )
    );

    try {
      const { error } = await supabase
        .from("user_books")
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq("google_book_id", googleBookId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to move book in database:", err);
      // Rollback on error
      setBooks(previousBooks);
    }
  };

  // Optimistically remove a book from the tracking list
  const handleRemoveBook = async (googleBookId: string) => {
    if (!user) return;

    const previousBooks = [...books];

    // Remove from local state instantly (Optimistic UI)
    setBooks((prev) => prev.filter((b) => b.google_book_id !== googleBookId));

    try {
      const { error } = await supabase
        .from("user_books")
        .delete()
        .eq("google_book_id", googleBookId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete book in database:", err);
      // Rollback on error
      setBooks(previousBooks);
    }
  };

  // Fetch full details of the book from Google Books to display in Modal
  const handleCardClick = async (userBook: UserBook) => {
    // Show a light placeholder modal or loading state if needed
    try {
      const fullBook = await prefetchBookDetails(userBook.google_book_id);
      if (fullBook) {
        setSelectedBook(fullBook);
      } else {
        // Fallback structure if API call fails
        setSelectedBook({
          id: userBook.google_book_id,
          title: userBook.title,
          authors: userBook.author ? userBook.author.split(", ") : ["Unknown Author"],
          description: "Details not available. Check your internet connection.",
          coverUrl: userBook.cover_url,
          categories: ["Library"],
          publishedDate: "N/A",
          publisher: "N/A",
          language: "en",
        });
      }
    } catch (err) {
      console.error("Error opening book modal:", err);
    }
  };

  // Synchronize book status updates inside detail modal
  const handleModalStatusChange = async (book: Book, status: "reading" | "on_hold" | "finished") => {
    await handleMoveBook(book.id, status);
  };

  // Filter books by status column
  const readingBooks = books.filter((b) => b.status === "reading");
  const onHoldBooks = books.filter((b) => b.status === "on_hold");
  const finishedBooks = books.filter((b) => b.status === "finished");

  const columnHeaders = [
    {
      status: "reading" as const,
      title: "Reading",
      icon: <BookOpen className="h-5 w-5 text-rose-500" />,
      booksList: readingBooks,
      accentClass: "border-t-2 border-rose-500",
    },
    {
      status: "on_hold" as const,
      title: "On Hold",
      icon: <Pause className="h-5 w-5 text-amber-500 fill-current" />,
      booksList: onHoldBooks,
      accentClass: "border-t-2 border-amber-500",
    },
    {
      status: "finished" as const,
      title: "Finished",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      booksList: finishedBooks,
      accentClass: "border-t-2 border-emerald-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
        <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
          Entering Your Space...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground pb-20">
      {/* Navigation */}
      <Navbar user={user} onBookClick={(book) => setSelectedBook(book)} />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-100">
            My Space
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Manage your personal library logs. Move cards across board lists instantly.
          </p>
        </div>

        {/* 3-Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {columnHeaders.map((col) => (
            <div
              key={col.status}
              className={`rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5 min-h-[500px] flex flex-col ${col.accentClass}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-5">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="font-bold text-zinc-200">{col.title}</h3>
                </div>
                <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 text-xs font-bold text-zinc-400">
                  {col.booksList.length}
                </span>
              </div>

              {/* Cards List with Layout Animations */}
              <div className="flex-1 space-y-4">
                <AnimatePresence mode="popLayout">
                  {col.booksList.length > 0 ? (
                    col.booksList.map((book) => (
                      <motion.div
                        key={book.google_book_id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={() => handleCardClick(book)}
                        className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-3 hover:border-zinc-850 hover:bg-zinc-900 transition-colors shadow-sm flex gap-3 cursor-pointer relative group"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-18 flex-none overflow-hidden rounded bg-zinc-950 border border-zinc-850 shadow">
                          {!book.cover_url || book.cover_url.includes("9780141439518") ? (
                            <BookCoverPlaceholder title={book.title} mini={true} />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* Text details */}
                        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-between pr-8">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-zinc-200 truncate leading-snug line-clamp-2" title={book.title}>
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5 line-clamp-1">
                              {book.author}
                            </p>
                          </div>

                          {/* Quick Navigation Triggers */}
                          <div className="flex items-center gap-2 mt-2">
                            {col.status !== "reading" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBook(book.google_book_id, "reading");
                                }}
                                className="rounded bg-rose-950/20 text-rose-500 hover:bg-rose-950/40 p-1 transition-colors border border-rose-500/10 cursor-pointer"
                                title="Move to Reading"
                              >
                                <BookOpen className="h-3 w-3" />
                              </button>
                            )}

                            {col.status !== "on_hold" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBook(book.google_book_id, "on_hold");
                                }}
                                className="rounded bg-amber-950/20 text-amber-500 hover:bg-amber-950/40 p-1 transition-colors border border-amber-500/10 cursor-pointer"
                                title="Move to On Hold"
                              >
                                <Pause className="h-3 w-3 fill-current" />
                              </button>
                            )}

                            {col.status !== "finished" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBook(book.google_book_id, "finished");
                                }}
                                className="rounded bg-emerald-950/20 text-emerald-500 hover:bg-emerald-950/40 p-1 transition-colors border border-emerald-500/10 cursor-pointer"
                                title="Move to Finished"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Delete trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBook(book.google_book_id);
                          }}
                          className="absolute right-3 top-3 rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Remove Book"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-40 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center text-center p-4">
                      <HelpCircle className="h-6 w-6 text-zinc-850" />
                      <p className="text-zinc-600 text-[11px] font-semibold uppercase mt-2">
                        List Empty
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Book details Modal */}
      <BookModal
        book={selectedBook}
        isOpen={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
        onAddToList={handleModalStatusChange}
        alreadyAdded={
          selectedBook
            ? books.find((b) => b.google_book_id === selectedBook.id)?.status
            : undefined
        }
      />
    </div>
  );
}
