"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Users,
  Crown,
  LogOut,
  LogIn,
  Send,
  Trash2,
  ArrowLeft,
  BookOpen,
  MessageCircle,
  Shield,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import Navbar from "@/components/Navbar";
import BookCoverPlaceholder from "@/components/BookCoverPlaceholder";

interface ClubData {
  id: string;
  name: string;
  description: string;
  cover_book_id: string | null;
  cover_book_title: string | null;
  cover_book_url: string | null;
  created_by: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  username: string;
}

interface Post {
  id: string;
  club_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
}

interface ClubDetailProps {
  clubId: string;
}

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

export default function ClubDetail({ clubId }: ClubDetailProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<ClubData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const fetchClubData = useCallback(async () => {
    try {
      // Fetch club details
      const { data: clubData, error: clubErr } = await supabase
        .from("book_clubs")
        .select("*")
        .eq("id", clubId)
        .single();

      if (clubErr) throw clubErr;
      setClub(clubData);

      // Fetch members
      const { data: membersData, error: membersErr } = await supabase
        .from("club_members")
        .select("*")
        .eq("club_id", clubId)
        .order("joined_at", { ascending: true });

      if (membersErr) throw membersErr;

      // Get usernames
      const userIds = (membersData || []).map((m: Member) => m.user_id);
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

      const enrichedMembers: Member[] = (membersData || []).map((m: Member) => ({
        ...m,
        username: usernameMap[m.user_id] || "Anonymous",
      }));
      setMembers(enrichedMembers);

      // Check if current user is a member
      if (user) {
        const currentMember = enrichedMembers.find((m) => m.user_id === user.id);
        setIsMember(!!currentMember);
        setIsAdmin(currentMember?.role === "admin");
      }

      // Fetch posts (only works if user is a member due to RLS)
      const { data: postsData } = await supabase
        .from("club_posts")
        .select("*")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true });

      // Get post author usernames
      const postUserIds = [...new Set((postsData || []).map((p: Post) => p.user_id))];
      let postUsernameMap: Record<string, string> = {};
      if (postUserIds.length > 0) {
        const { data: postProfiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", postUserIds);
        if (postProfiles) {
          postProfiles.forEach((p: { id: string; username: string }) => {
            postUsernameMap[p.id] = p.username;
          });
        }
      }

      const enrichedPosts: Post[] = (postsData || []).map((p: Post) => ({
        ...p,
        username: postUsernameMap[p.user_id] || usernameMap[p.user_id] || "Anonymous",
      }));
      setPosts(enrichedPosts);
    } catch (err) {
      console.error("Error loading club:", err);
    }
  }, [clubId, supabase, user]);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setUser(session.user);
    }
    init();
  }, [router, supabase]);

  useEffect(() => {
    if (user) {
      fetchClubData().finally(() => setLoading(false));
    }
  }, [user, fetchClubData]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const { error } = await supabase.from("club_members").insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
      });
      if (error) throw error;
      setIsMember(true);
      await fetchClubData();
    } catch (err) {
      console.error("Error joining club:", err);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const { error } = await supabase
        .from("club_members")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", user.id);
      if (error) throw error;
      setIsMember(false);
      setIsAdmin(false);
      await fetchClubData();
    } catch (err) {
      console.error("Error leaving club:", err);
    } finally {
      setJoining(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim() || !user) return;
    setSubmittingPost(true);
    try {
      const { error } = await supabase.from("club_posts").insert({
        club_id: clubId,
        user_id: user.id,
        content: newPost.trim(),
      });
      if (error) throw error;
      setNewPost("");
      await fetchClubData();
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setDeletingPostId(postId);
    try {
      const { error } = await supabase
        .from("club_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setDeletingPostId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Navbar user={user} />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="text-xl font-bold text-zinc-300">Club Not Found</h2>
          <button
            onClick={() => router.push("/clubs")}
            className="mt-4 text-sm text-rose-500 hover:text-rose-400 cursor-pointer font-bold"
          >
            ← Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} />

      {/* Club Header */}
      <div className="relative overflow-hidden">
        {/* Background blur from cover */}
        <div className="absolute inset-0 overflow-hidden">
          {club.cover_book_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={club.cover_book_url}
              alt=""
              className="w-full h-full object-cover opacity-10 blur-2xl scale-125"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-rose-600/8 via-transparent to-violet-600/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 to-zinc-950" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/clubs")}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer mb-5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Clubs
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Cover Thumbnail */}
            <div className="h-24 w-16 sm:h-28 sm:w-20 rounded-xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-800 flex-shrink-0">
              {club.cover_book_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={club.cover_book_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookCoverPlaceholder title={club.name} authors={[]} />
              )}
            </div>

            {/* Club Info */}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-serif tracking-tight">
                {club.name}
              </h1>
              {club.description && (
                <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                  {club.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </span>
                {club.cover_book_title && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Reading: {club.cover_book_title}
                  </span>
                )}
                <span className="text-zinc-600">
                  Created {timeAgo(club.created_at)}
                </span>
              </div>
            </div>

            {/* Join/Leave Button */}
            <div className="flex-shrink-0">
              {isMember ? (
                <button
                  onClick={handleLeave}
                  disabled={joining || isAdmin}
                  title={isAdmin ? "Admins cannot leave their own club" : "Leave this club"}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold border transition-all cursor-pointer bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-rose-500/30 hover:text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Leave Club
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                >
                  {joining ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogIn className="h-3.5 w-3.5" />
                  )}
                  Join Club
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content: Discussion + Members */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Discussion Feed */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-rose-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Discussion
                </h2>
                <span className="text-xs text-zinc-600">({posts.length})</span>
              </div>

              {/* Mobile members toggle */}
              <button
                onClick={() => setShowMembers(!showMembers)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                Members ({members.length})
              </button>
            </div>

            {/* Posts */}
            {!isMember ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center">
                <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-400">
                  Join this club to view and participate in discussions
                </h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Club discussions are visible only to members.
                </p>
              </div>
            ) : (
              <>
                {/* Compose Box */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="flex gap-2">
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(
                        user?.email || "U"
                      )}`}
                    >
                      {(user?.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handlePostSubmit();
                          }
                        }}
                        placeholder="Share something with the club..."
                        className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-600/50 transition-colors"
                      />
                      <button
                        onClick={handlePostSubmit}
                        disabled={!newPost.trim() || submittingPost}
                        className="rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-3 py-2 text-sm font-bold transition-all cursor-pointer"
                      >
                        {submittingPost ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posts Feed */}
                <div className="space-y-3">
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-10 w-10 text-zinc-800 mx-auto mb-3" />
                      <p className="text-sm text-zinc-600">
                        No discussions yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {posts.map((post, idx) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{
                            delay: idx * 0.03,
                            duration: 0.25,
                          }}
                          className="group rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 hover:border-zinc-800 transition-colors"
                        >
                          <div className="flex gap-3">
                            {/* Avatar */}
                            <div
                              className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor(
                                post.username
                              )}`}
                            >
                              {post.username.charAt(0).toUpperCase()}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-zinc-200">
                                  {post.username}
                                </span>
                                {/* Admin badge */}
                                {members.find(
                                  (m) =>
                                    m.user_id === post.user_id &&
                                    m.role === "admin"
                                ) && (
                                  <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0 text-[9px] font-bold text-amber-500 uppercase">
                                    <Shield className="h-2.5 w-2.5" />
                                    Admin
                                  </span>
                                )}
                                <span className="text-[10px] text-zinc-600">
                                  {timeAgo(post.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                                {post.content}
                              </p>
                            </div>

                            {/* Delete */}
                            {(user?.id === post.user_id || isAdmin) && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                disabled={deletingPostId === post.id}
                                className="flex-shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity rounded p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-zinc-900 cursor-pointer"
                              >
                                {deletingPostId === post.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Members Sidebar */}
          <div
            className={`lg:col-span-4 ${
              showMembers ? "block" : "hidden lg:block"
            }`}
          >
            <div className="sticky top-20 rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Members
                </h3>
                <span className="text-[10px] text-zinc-600 ml-auto">
                  {members.length}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto p-2 space-y-0.5">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${avatarColor(
                        member.username
                      )}`}
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-300 truncate">
                        {member.username}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        Joined {timeAgo(member.joined_at)}
                      </p>
                    </div>
                    {member.role === "admin" && (
                      <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
