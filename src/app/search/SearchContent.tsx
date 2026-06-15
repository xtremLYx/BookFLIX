"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import { searchBooks, Book } from "@/utils/books";
import Navbar from "@/components/Navbar";
import BookCard from "@/components/BookCard";
import BookModal from "@/components/BookModal";

interface SearchContentProps {
  initialQuery: string;
}

const GENRES = [
  "Fiction",
  "Science",
  "History",
  "Biography",
  "Computers",
  "Business",
  "Philosophy",
  "Psychology",
  "Poetry",
  "Drama",
];

const LANGUAGES = [
  { code: "", label: "Any Language" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
];

export default function SearchContent({ initialQuery }: SearchContentProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Search and Filter States
  const [query, setQuery] = useState(initialQuery);
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Search Results & Loading
  const [results, setResults] = useState<Book[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Detail Modal & Tracking States
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [userBooksStatuses, setUserBooksStatuses] = useState<
    Record<string, "reading" | "on_hold" | "finished">
  >({});

  // Generate Year options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 47 }, (_, i) => String(currentYear - i));

  // Sync prop changes (handled via `key` prop in page.tsx)

  // Authenticate user and fetch their tracking list
  useEffect(() => {
    async function initPage() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setUser(session.user);
      setAuthLoading(false);

      try {
        const { data: userBooks, error } = await supabase
          .from("user_books")
          .select("google_book_id, status");

        if (!error && userBooks) {
          const statusMap: Record<string, "reading" | "on_hold" | "finished"> = {};
          userBooks.forEach(
            (b: {
              google_book_id: string;
              status: "reading" | "on_hold" | "finished";
            }) => {
              statusMap[b.google_book_id] = b.status;
            }
          );
          setUserBooksStatuses(statusMap);
        }
      } catch (err) {
        console.error("Error loading user book tracking statuses:", err);
      }
    }
    initPage();
  }, [router, supabase]);

  // Debounced search logic
  useEffect(() => {
    // If absolutely no criteria, clean search results
    if (!query.trim() && !selectedGenre && !author && !year && !language) {
      const timer = setTimeout(() => {
        setResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const searchTimer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const books = await searchBooks(query, {
          genre: selectedGenre || undefined,
          author: author || undefined,
          year: year || undefined,
          language: language || undefined,
        });
        setResults(books);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(searchTimer);
  }, [query, author, year, selectedGenre, language]);

  // Handle tracking state updates
  const handleAddToList = useCallback(
    async (book: Book, status: "reading" | "on_hold" | "finished") => {
      if (!user) return;

      const previousStatus = userBooksStatuses[book.id];
      setUserBooksStatuses((prev) => ({
        ...prev,
        [book.id]: status,
      }));

      try {
        const { error } = await supabase.from("user_books").upsert(
          {
            user_id: user.id,
            google_book_id: book.id,
            title: book.title,
            author: book.authors.join(", "),
            cover_url: book.coverUrl,
            status: status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,google_book_id" }
        );

        if (error) throw error;
      } catch (err) {
        console.error("Failed to add book to list:", err);
        // Rollback optimistic update
        setUserBooksStatuses((prev) => {
          const next = { ...prev };
          if (previousStatus) {
            next[book.id] = previousStatus;
          } else {
            delete next[book.id];
          }
          return next;
        });
      }
    },
    [user, userBooksStatuses, supabase]
  );

  const resetFilters = () => {
    setQuery("");
    setAuthor("");
    setYear("");
    setSelectedGenre("");
    setLanguage("");
    setResults([]);
    // Update URL query string
    router.push("/search", { scroll: false });
  };

  const handlePageSearchChange = (val: string) => {
    setQuery(val);
    // Sync to URL query string
    const params = new URLSearchParams();
    if (val.trim()) {
      params.set("q", val.trim());
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (author) count++;
    if (year) count++;
    if (selectedGenre) count++;
    if (language) count++;
    return count;
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
        <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
          Curating Your Gallery...
        </span>
      </div>
    );
  }

  const activeFiltersCount = getActiveFilterCount();

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground pb-20">
      <Navbar user={user} onBookClick={(book) => setSelectedBook(book)} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
        {/* Search header & input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-900">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 font-serif">
              Search Results
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              {query.trim() ? (
                <>
                  Showing books matching{" "}
                  <span className="text-rose-500 font-semibold">
                    &ldquo;{query}&rdquo;
                  </span>
                </>
              ) : (
                "Type a query or apply filters to search the library."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input on page */}
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 border border-zinc-800 w-full md:w-80">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search titles, authors..."
                value={query}
                onChange={(e) => handlePageSearchChange(e.target.value)}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => handlePageSearchChange("")}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border cursor-pointer transition-all duration-300 ${
                showFilters || activeFiltersCount > 0
                  ? "bg-rose-950/20 border-rose-800 text-rose-500"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 my-6 bg-zinc-900/50 rounded-2xl border border-zinc-900">
                {/* Author filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Author
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., J.K. Rowling"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm text-zinc-200 border border-zinc-800 focus:border-rose-600 focus:outline-none"
                  />
                </div>

                {/* Genre Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Genre
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm text-zinc-200 border border-zinc-800 focus:border-rose-600 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Genres</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g.toLowerCase()}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Publish Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm text-zinc-200 border border-zinc-800 focus:border-rose-600 focus:outline-none cursor-pointer"
                  >
                    <option value="">Any Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-lg bg-zinc-950 px-3 py-2 text-sm text-zinc-200 border border-zinc-800 focus:border-rose-600 focus:outline-none cursor-pointer"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters Option */}
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2 pt-4 border-t border-zinc-800">
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results section */}
        <div className="mt-8">
          {searchLoading ? (
            // Skeleton Loader Grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-3 animate-pulse cursor-default"
                >
                  <div className="aspect-[2/3] w-full rounded-xl bg-zinc-900 border border-zinc-800/40" />
                  <div className="h-4 w-3/4 rounded bg-zinc-900" />
                  <div className="h-3 w-1/2 rounded bg-zinc-900" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            // Book Results Grid
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.03 },
                },
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            >
              {results.map((book) => (
                <motion.div
                  key={book.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ type: "spring", stiffness: 150, damping: 18 }}
                >
                  <BookCard
                    book={book}
                    onBookClick={(b) => setSelectedBook(b)}
                    onAddToList={handleAddToList}
                    alreadyAdded={userBooksStatuses[book.id]}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Empty / No Results State
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-zinc-900/10 border border-dashed border-zinc-900/50">
              <Sparkles className="h-12 w-12 text-zinc-700 animate-pulse mb-4" />
              <h3 className="text-lg font-bold text-zinc-300 font-serif">
                No Books Found
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mt-2">
                We couldn&apos;t find any books matching your criteria. Try adjusting
                your keywords, resetting filters, or exploring different genres.
              </p>
              {(query || activeFiltersCount > 0) && (
                <button
                  onClick={resetFilters}
                  className="mt-6 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Book details Modal */}
      <BookModal
        book={selectedBook}
        isOpen={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
        onAddToList={handleAddToList}
        alreadyAdded={
          selectedBook ? userBooksStatuses[selectedBook.id] : undefined
        }
      />
    </div>
  );
}
