"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Users,
  Plus,
  Crown,
  BookOpen,
  Filter,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import Navbar from "@/components/Navbar";
import CreateClubModal from "@/components/CreateClubModal";
import BookCoverPlaceholder from "@/components/BookCoverPlaceholder";

interface Club {
  id: string;
  name: string;
  description: string;
  cover_book_id: string | null;
  cover_book_title: string | null;
  cover_book_url: string | null;
  created_by: string;
  created_at: string;
  member_count: number;
  is_member: boolean;
  creator_name: string;
}

export default function ClubsPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "my">("all");

  const fetchClubs = useCallback(async () => {
    try {
      // Fetch all clubs
      const { data: clubsData, error: clubsErr } = await supabase
        .from("book_clubs")
        .select("*")
        .order("created_at", { ascending: false });

      if (clubsErr) throw clubsErr;

      // Fetch all memberships for counts + current user check
      const { data: membersData } = await supabase
        .from("club_members")
        .select("club_id, user_id");

      // Fetch creator profiles
      const creatorIds = [...new Set((clubsData || []).map((c: Club) => c.created_by))];
      let creatorMap: Record<string, string> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", creatorIds);
        if (profiles) {
          profiles.forEach((p: { id: string; username: string }) => {
            creatorMap[p.id] = p.username;
          });
        }
      }

      const enriched: Club[] = (clubsData || []).map((club: Club) => {
        const members = (membersData || []).filter(
          (m: { club_id: string; user_id: string }) => m.club_id === club.id
        );
        return {
          ...club,
          member_count: members.length,
          is_member: user
            ? members.some(
                (m: { club_id: string; user_id: string }) =>
                  m.user_id === user.id
              )
            : false,
          creator_name: creatorMap[club.created_by] || "Unknown",
        };
      });

      setClubs(enriched);
    } catch (err) {
      console.error("Error fetching clubs:", err);
    }
  }, [supabase, user]);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      fetchClubs().finally(() => setLoading(false));
    }
  }, [user, fetchClubs]);

  const filteredClubs =
    filter === "my" ? clubs.filter((c) => c.is_member) : clubs;

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar user={user} />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/8 via-transparent to-violet-600/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 font-serif tracking-tight">
                Book Clubs
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500 max-w-lg">
                Join a community of readers. Discuss your favorite books, share
                recommendations, and connect with fellow bookworms.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 text-sm font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <Plus className="h-4 w-4" />
              Create Club
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-600" />
            {(["all", "my"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                  filter === f
                    ? "bg-rose-600/10 border-rose-500/30 text-rose-500"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {f === "all" ? "All Clubs" : "My Clubs"}
              </button>
            ))}
            <span className="ml-2 text-xs text-zinc-600">
              {filteredClubs.length} club{filteredClubs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {filteredClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="h-14 w-14 text-zinc-800 mb-4" />
            <h3 className="text-lg font-bold text-zinc-400 font-serif">
              {filter === "my"
                ? "You haven't joined any clubs yet"
                : "No clubs created yet"}
            </h3>
            <p className="text-sm text-zinc-600 mt-1.5 max-w-sm">
              {filter === "my"
                ? "Browse all clubs and join one that interests you!"
                : "Be the first to create a book club and start a community."}
            </p>
            {filter === "my" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 text-xs font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
              >
                Browse All Clubs →
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredClubs.map((club) => (
              <motion.div
                key={club.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
              >
                <button
                  onClick={() => router.push(`/clubs/${club.id}`)}
                  className="group w-full text-left rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Cover Banner */}
                  <div className="relative h-28 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                    {club.cover_book_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={club.cover_book_url}
                        alt=""
                        className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity blur-sm scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 to-violet-600/10" />
                    )}

                    {/* Cover Book Thumbnail */}
                    <div className="absolute bottom-3 left-4 flex items-end gap-3">
                      <div className="h-16 w-11 rounded-lg overflow-hidden border border-zinc-700 shadow-lg bg-zinc-800 flex-shrink-0">
                        {club.cover_book_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={club.cover_book_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookCoverPlaceholder
                            title={club.name}
                            authors={[]}
                          />
                        )}
                      </div>
                    </div>

                    {/* Member Badge */}
                    {club.is_member && (
                      <div className="absolute top-3 right-3 rounded-full bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        Joined
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2">
                    <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                      {club.name}
                    </h3>
                    {club.description && (
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                        {club.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {club.member_count} member
                          {club.member_count !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-600" />
                          {club.creator_name}
                        </span>
                      </div>
                      {club.cover_book_title && (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-600 max-w-[120px]">
                          <BookOpen className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {club.cover_book_title}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create Club Modal */}
      {user && (
        <CreateClubModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          userId={user.id}
          onCreated={fetchClubs}
        />
      )}
    </div>
  );
}
