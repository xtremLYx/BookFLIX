"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import {
  getBookOfTheDay,
  getCategoryBooks,
  getTrendingBooks,
  Book,
} from "@/utils/books";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BookRow from "@/components/BookRow";
import BookModal from "@/components/BookModal";
import SearchOverlay from "@/components/SearchOverlay";
import MagneticButton from "@/components/MagneticButton";

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [booksLoading, setBooksLoading] = useState(true);

  // Books Data
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
  const [topSelling, setTopSelling] = useState<Book[]>([]);
  const [topTrending, setTopTrending] = useState<Book[]>([]);
  const [newReleases, setNewReleases] = useState<Book[]>([]);
  
  // User's catalog mapping: google_book_id -> status
  const [userBooksStatuses, setUserBooksStatuses] = useState<Record<string, "reading" | "on_hold" | "finished">>({});

  // UI state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Authenticate and fetch lists
  useEffect(() => {
    async function loadDashboardData() {
      // 1. Check user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setUser(session.user);
      setSessionChecked(true);

      try {
        // 2. Fetch User Books from Supabase
        if (session) {
          const { data: userBooks, error } = await supabase
            .from("user_books")
            .select("google_book_id, status");

          if (!error && userBooks) {
            const statusMap: Record<string, "reading" | "on_hold" | "finished"> = {};
            userBooks.forEach((b: { google_book_id: string; status: "reading" | "on_hold" | "finished" }) => {
              statusMap[b.google_book_id] = b.status;
            });
            setUserBooksStatuses(statusMap);
          }
        }

        // 3. Fetch Google Books Carousels
        const [featured, selling, trending, releases] = await Promise.all([
          getBookOfTheDay(),
          getCategoryBooks("fiction", 12),
          getTrendingBooks(12),
          getCategoryBooks("computers", 12),
        ]);

        setFeaturedBook(featured);
        setTopSelling(selling);
        setTopTrending(trending);
        setNewReleases(releases);

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setBooksLoading(false);
      }
    }

    loadDashboardData();
  }, [router, supabase]);

  // Add or update book tracking status
  const handleAddToList = useCallback(async (book: Book, status: "reading" | "on_hold" | "finished") => {
    if (!user) return;

    // Optimistic UI update
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
      console.error("Error adding book to list:", err);
      // Rollback on failure
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
  }, [user, userBooksStatuses, supabase]);

  if (!sessionChecked) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
        <span className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">
          Verifying Session...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground pb-20">
      {/* Navigation */}
      <Navbar user={user} onBookClick={(book) => setSelectedBook(book)} />

      {/* Floating Advanced Search Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <MagneticButton
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 rounded-full bg-rose-600 p-4 text-white shadow-xl shadow-rose-950/40 border border-rose-500 hover:bg-rose-700 cursor-pointer"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="hidden md:inline text-xs font-bold uppercase tracking-wider pr-1">
            Filter Books
          </span>
        </MagneticButton>
      </div>

      {/* Featured Hero Banner / Skeleton */}
      {featuredBook ? (
        <Hero
          book={featuredBook}
          onBookClick={(book) => setSelectedBook(book)}
          onAddToList={handleAddToList}
          alreadyAdded={userBooksStatuses[featuredBook.id]}
        />
      ) : (
        /* Hero Skeleton */
        <div className="relative w-full h-[70vh] min-h-[480px] max-h-[600px] flex items-center justify-start overflow-hidden bg-zinc-950 px-4 sm:px-6 lg:px-8 border-b border-zinc-900">
          <div className="max-w-2xl space-y-4 w-full">
            <div className="h-6 w-32 rounded bg-zinc-900 border border-zinc-800 animate-pulse" />
            <div className="h-12 w-3/4 rounded bg-zinc-900 border border-zinc-800 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-zinc-900 border border-zinc-800 animate-pulse" />
            <div className="h-20 w-full rounded bg-zinc-900 border border-zinc-800 animate-pulse" />
            <div className="flex gap-4 pt-2">
              <div className="h-10 w-28 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
              <div className="h-10 w-28 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Carousels Category Lists */}
      <div className="mt-[-20px] relative z-20 space-y-12">
        <BookRow
          title="Top Selling Fiction"
          books={topSelling}
          onBookClick={(book) => setSelectedBook(book)}
          onAddToList={handleAddToList}
          userBooksStatuses={userBooksStatuses}
        />
        
        <BookRow
          title="Trending Now"
          books={topTrending}
          onBookClick={(book) => setSelectedBook(book)}
          onAddToList={handleAddToList}
          userBooksStatuses={userBooksStatuses}
        />

        <BookRow
          title="New in Technology"
          books={newReleases}
          onBookClick={(book) => setSelectedBook(book)}
          onAddToList={handleAddToList}
          userBooksStatuses={userBooksStatuses}
        />
      </div>

      {/* Advanced Filter Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onBookClick={(book) => setSelectedBook(book)}
        onAddToList={handleAddToList}
        userBooksStatuses={userBooksStatuses}
      />

      {/* Book Details Modal */}
      <BookModal
        book={selectedBook}
        isOpen={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
        onAddToList={handleAddToList}
        alreadyAdded={selectedBook ? userBooksStatuses[selectedBook.id] : undefined}
        userId={user?.id}
      />
    </div>
  );
}
