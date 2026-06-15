"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Send,
  Trash2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";

interface Comment {
  id: string;
  book_id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
  username: string;
}

interface BookCommentsProps {
  bookId: string;
  userId?: string;
}

// Deterministic color from a string
function avatarColor(name: string): string {
  const colors = [
    "bg-rose-600", "bg-amber-600", "bg-emerald-600", "bg-cyan-600",
    "bg-violet-600", "bg-pink-600", "bg-teal-600", "bg-indigo-600",
    "bg-orange-600", "bg-lime-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function BookComments({ bookId, userId }: BookCommentsProps) {
  const supabase = getSupabaseBrowserClient();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      // Fetch comments and join with profiles for username
      const { data, error } = await supabase
        .from("book_comments")
        .select("*")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch usernames for all unique user_ids
      const userIds = [...new Set((data || []).map((c: Comment) => c.user_id))];
      let usernameMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        if (profiles) {
          profiles.forEach((p: { id: string; username: string }) => {
            usernameMap[p.id] = p.username;
          });
        }
      }

      const enriched = (data || []).map((c: Comment) => ({
        ...c,
        username: usernameMap[c.user_id] || "Anonymous",
      }));

      setComments(enriched);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [bookId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !userId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("book_comments").insert({
        book_id: bookId,
        user_id: userId,
        content: newComment.trim(),
        rating: newRating > 0 ? newRating : null,
      });

      if (error) throw error;

      setNewComment("");
      setNewRating(0);
      await fetchComments();
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const { error } = await supabase
        .from("book_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const avgRating =
    comments.filter((c) => c.rating).length > 0
      ? (
          comments.filter((c) => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) /
          comments.filter((c) => c.rating).length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-rose-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Community Reviews
          </h4>
          <span className="text-xs text-zinc-600">({comments.length})</span>
        </div>
        {avgRating && (
          <div className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span className="text-xs font-bold text-amber-500">{avgRating}</span>
            <span className="text-[10px] text-zinc-500">avg</span>
          </div>
        )}
      </div>

      {/* Compose Area */}
      {userId && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-3">
          {/* Star Rating Picker */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium text-zinc-500 mr-1.5 uppercase tracking-wider">
              Rate:
            </span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setNewRating(star === newRating ? 0 : star)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  className={`h-4 w-4 transition-colors ${
                    star <= (hoverRating || newRating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-zinc-700"
                  }`}
                />
              </button>
            ))}
            {newRating > 0 && (
              <span className="ml-1 text-[10px] text-amber-500/70">{newRating}/5</span>
            )}
          </div>

          {/* Input + Send */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Share your thoughts on this book..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-600/50 transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-3 py-2 text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {comments.map((comment, idx) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04, duration: 0.25 }}
                className="group flex gap-3 rounded-lg border border-zinc-900 bg-zinc-950/40 p-3 hover:border-zinc-800 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(
                    comment.username
                  )}`}
                >
                  {comment.username.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-zinc-300">
                      {comment.username}
                    </span>
                    {comment.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${
                              i < comment.rating!
                                ? "fill-amber-500 text-amber-500"
                                : "text-zinc-800"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-zinc-600">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed break-words">
                    {comment.content}
                  </p>
                </div>

                {/* Delete (own comments only) */}
                {userId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-zinc-600 hover:text-rose-500 hover:bg-zinc-900 cursor-pointer"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
