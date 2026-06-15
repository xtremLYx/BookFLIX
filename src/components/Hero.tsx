"use client";

import React from "react";
import { BookOpen, Plus, Info, Star, Check } from "lucide-react";
import MagneticButton from "./MagneticButton";
import { Book } from "@/utils/books";

interface HeroProps {
  book: Book;
  onBookClick: (book: Book) => void;
  onAddToList?: (book: Book, status: "reading" | "on_hold" | "finished") => void;
  alreadyAdded?: "reading" | "on_hold" | "finished";
}

export default function Hero({ book, onBookClick, onAddToList, alreadyAdded }: HeroProps) {

  return (
    <div className="relative w-full h-[70vh] min-h-[480px] max-h-[600px] flex items-center justify-start overflow-hidden bg-zinc-950">
      {/* Background Cover Image with Gradient Mask */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-700 select-none opacity-40 md:opacity-55"
        style={{ backgroundImage: `url(${book.coverUrl})` }}
      />
      
      {/* Immersive Overlays */}
      {/* Horizontal fade: solid black on left (text readability) to transparent on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent w-full h-full" />
      
      {/* Vertical fade: solid black at bottom (fades into content rows) to transparent at top */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent w-full h-full" />
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl space-y-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-rose-500 uppercase">
            <Star className="h-3.5 w-3.5 fill-current animate-pulse" />
            Book of the Day
          </div>
          
          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-100 leading-tight line-clamp-2">
            {book.title}
          </h1>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-300">
            <span>By {book.authors.join(", ")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="uppercase text-rose-500">{book.categories[0]}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span>{book.publishedDate.substring(0, 4)}</span>
            
            {book.averageRating && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{book.averageRating}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Description */}
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl">
            {book.description}
          </p>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {book.previewLink && (
              <MagneticButton
                onClick={() => window.open(book.previewLink, "_blank")}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-zinc-100 shadow-lg shadow-rose-950/20 hover:bg-rose-700 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 fill-current" />
                <span>Read Preview</span>
              </MagneticButton>
            )}
            
            {onAddToList && (
              <MagneticButton
                onClick={() => !alreadyAdded && onAddToList(book, "reading")}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold cursor-pointer transition-colors ${
                  alreadyAdded
                    ? "bg-rose-600 text-white border border-rose-500"
                    : "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                {alreadyAdded ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>In My List ({alreadyAdded.replace("_", " ")})</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>My List</span>
                  </>
                )}
              </MagneticButton>
            )}
            
            <button
              onClick={() => onBookClick(book)}
              className="flex items-center gap-2 rounded-xl bg-transparent px-4 py-3 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Info className="h-4 w-4" />
              <span>More Info</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
