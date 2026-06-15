"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import BookCard from "./BookCard";
import { Book } from "@/utils/books";

interface BookRowProps {
  title: string;
  books: Book[];
  onBookClick: (book: Book) => void;
  onAddToList?: (book: Book, status: "reading" | "on_hold" | "finished") => Promise<void>;
  userBooksStatuses?: Record<string, "reading" | "on_hold" | "finished">;
}

export default function BookRow({
  title,
  books,
  onBookClick,
  onAddToList,
  userBooksStatuses = {},
}: BookRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const row = rowRef.current;
    if (row) {
      row.addEventListener("scroll", checkScroll);
      // Run once initially
      checkScroll();
      // Also run when books change
      setTimeout(checkScroll, 500);
    }
    return () => row?.removeEventListener("scroll", checkScroll);
  }, [books]);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Staggered motion variants using physics-based spring curves
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 14,
      },
    },
  };

  return (
    <div ref={containerRef} className="relative py-4 space-y-2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-zinc-200">
        {title}
      </h3>

      {/* Row Wrapper */}
      <div className="relative group/row">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-100 hover:bg-rose-600 hover:text-white border border-zinc-800 hover:border-rose-500 shadow-lg backdrop-blur-sm transition-all duration-300 opacity-0 group-hover/row:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-100 hover:bg-rose-600 hover:text-white border border-zinc-800 hover:border-rose-500 shadow-lg backdrop-blur-sm transition-all duration-300 opacity-0 group-hover/row:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Scroll Container with Framer Motion Staggered Entrance */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
          ref={rowRef}
          className="flex gap-4 overflow-x-scroll no-scrollbar py-6 px-1 select-none scroll-smooth"
        >
          {books.length > 0 ? (
            books.map((book) => (
              <motion.div key={book.id} variants={itemVariants} className="flex-none">
                <BookCard
                  book={book}
                  onBookClick={onBookClick}
                  onAddToList={onAddToList}
                  alreadyAdded={userBooksStatuses[book.id]}
                />
              </motion.div>
            ))
          ) : (
            // Row Skeletons
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="w-[140px] sm:w-[180px] aspect-[2/3] animate-pulse rounded-lg bg-zinc-900 border border-zinc-800"
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
