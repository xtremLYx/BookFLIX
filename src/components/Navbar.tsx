"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Film, LogOut, Loader2, Sparkles, BookOpen, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import { searchBooks, prefetchBookDetails, Book } from "@/utils/books";
import BookCoverPlaceholder from "./BookCoverPlaceholder";

interface NavbarProps {
  user?: { id: string; email?: string } | null;
  onBookClick?: (book: Book) => void;
}

export default function Navbar({ user, onBookClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchBooks(query);
        setSuggestions(results.slice(0, 6)); // limit to 6 suggestions
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      setSuggestions([]);
    };
  }, [query]);

  // Close suggestion box on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setSuggestions([]);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (book: Book) => {
    setQuery("");
    setSuggestions([]);
    if (onBookClick) {
      onBookClick(book);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-black tracking-tighter text-rose-600 hover:text-rose-500 transition-colors">
              <Film className="h-6 w-6 fill-current" />
              <span>BOOKFLIX</span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                <Link
                  href="/dashboard"
                  className={`hover:text-zinc-100 transition-colors ${
                    pathname === "/dashboard" ? "text-zinc-100 font-semibold" : ""
                  }`}
                >
                  Browse
                </Link>
                <Link
                  href="/clubs"
                  className={`hover:text-zinc-100 transition-colors flex items-center gap-1.5 ${
                    pathname?.startsWith("/clubs") ? "text-zinc-100 font-semibold" : ""
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Clubs
                </Link>
                <Link
                  href="/my-space"
                  className={`hover:text-zinc-100 transition-colors flex items-center gap-1.5 ${
                    pathname === "/my-space" ? "text-zinc-100 font-semibold" : ""
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  My Space
                </Link>
              </div>
            )}
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <div
                  className={`flex items-center gap-2 rounded-full bg-zinc-900 px-3.5 py-1.5 text-zinc-100 border border-zinc-800 transition-all duration-300 ${
                    searchOpen || query ? "w-64 md:w-80" : "w-10"
                  }`}
                >
                  <button
                    onClick={() => setSearchOpen(!searchOpen)}
                    className="text-zinc-400 hover:text-zinc-100 focus:outline-none cursor-pointer"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                  {(searchOpen || query) && (
                    <input
                      type="text"
                      placeholder="Titles, authors, genres..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
                      autoFocus
                    />
                  )}
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                </div>

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-rose-950/10">
                    <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-rose-500" />
                      SUGGESTIONS
                    </div>
                    <div className="mt-1 space-y-1">
                      {suggestions.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleSuggestionClick(book)}
                          onMouseEnter={() => prefetchBookDetails(book.id)}
                          className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-zinc-900 transition-colors group cursor-pointer"
                        >
                          {/* Book Thumbnail */}
                          <div className="h-10 w-7 flex-none overflow-hidden rounded bg-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                            {!book.coverUrl || book.coverUrl.includes("9780141439518") ? (
                              <BookCoverPlaceholder title={book.title} mini={true} />
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="truncate text-sm font-semibold text-zinc-200 group-hover:text-rose-500 transition-colors">
                              {book.title}
                            </p>
                            <p className="truncate text-xs text-zinc-400">
                              {book.authors.join(", ")}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile navigation links */}
            {user && (
              <div className="flex md:hidden items-center gap-3 text-zinc-400">
                <Link
                  href="/my-space"
                  className={`hover:text-zinc-100 transition-colors ${
                    pathname === "/my-space" ? "text-zinc-100" : ""
                  }`}
                >
                  Space
                </Link>
              </div>
            )}

            {/* User Dropdown / Sign Out */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-semibold text-zinc-200">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-zinc-500">Member</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-900 hover:text-rose-500 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/"
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-rose-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
