"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Film, Mail, Lock, User as UserIcon, Loader2, Tv } from "lucide-react";
import { getSupabaseBrowserClient } from "@/utils/supabase";
import MagneticButton from "@/components/MagneticButton";


export default function Home() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Check auth state on mount
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      } else {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setAuthLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split("@")[0],
            },
          },
        });

        if (error) throw error;
        
        if (data.session) {
          // Instantly logged in (e.g. email confirmation disabled)
          router.replace("/dashboard");
        } else {
          setSuccessMsg("Registration successful! Check your email to confirm.");
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-rose-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tighter text-rose-600">
          <Film className="h-6 w-6 fill-current" />
          <span>BOOKFLIX</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12">
        {/* Left Side: Pitch */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600/10 border border-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-500 tracking-wide uppercase">
            <Tv className="h-3.5 w-3.5" />
            Netflix for Books
          </span>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Infinite Stories. <br />
            <span className="text-zinc-400">Cinematic Discovery.</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto lg:mx-0">
            Discover thousands of digital titles, catalog them effortlessly in your Kanban space, and preview text instantly. Powered by Google Books.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 max-w-md pt-4 mx-auto lg:mx-0">
            <div className="border-l border-zinc-800 pl-4 text-left">
              <p className="text-2xl font-bold text-zinc-100 font-serif">10M+</p>
              <p className="text-xs text-zinc-500 font-semibold uppercase">Volumes</p>
            </div>
            <div className="border-l border-zinc-800 pl-4 text-left">
              <p className="text-2xl font-bold text-zinc-100 font-serif">100%</p>
              <p className="text-xs text-zinc-500 font-semibold uppercase">Free Search</p>
            </div>
            <div className="border-l border-zinc-800 pl-4 text-left">
              <p className="text-2xl font-bold text-zinc-100 font-serif">Zero</p>
              <p className="text-xs text-zinc-500 font-semibold uppercase">Ads</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Box */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            <h2 className="text-2xl font-bold text-zinc-100 font-serif">
              {isSignUp ? "Create Account" : "Sign In"}
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              {isSignUp ? "Join BookFlix to start tracking." : "Welcome back to your library."}
            </p>

            <form onSubmit={handleAuth} className="mt-6 space-y-4">
              {/* Errors/Success Notifications */}
              {errorMsg && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-500">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-500">
                  {successMsg}
                </div>
              )}

              {/* Username for Signup */}
              {isSignUp && (
                <div className="relative flex items-center rounded-xl bg-zinc-950 px-3.5 py-2.5 border border-zinc-800">
                  <UserIcon className="h-4 w-4 text-zinc-500 mr-2.5" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                    required={isSignUp}
                  />
                </div>
              )}

              {/* Email */}
              <div className="relative flex items-center rounded-xl bg-zinc-950 px-3.5 py-2.5 border border-zinc-800">
                <Mail className="h-4 w-4 text-zinc-500 mr-2.5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative flex items-center rounded-xl bg-zinc-950 px-3.5 py-2.5 border border-zinc-800">
                <Lock className="h-4 w-4 text-zinc-500 mr-2.5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  required
                />
              </div>

              {/* Action Button */}
              <MagneticButton
                type="submit"
                disabled={authLoading}
                className="w-full rounded-xl bg-rose-600 py-3 text-sm font-bold text-zinc-100 shadow-lg shadow-rose-950/20 hover:bg-rose-700 cursor-pointer flex justify-center items-center"
              >
                {authLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  "Create Membership"
                ) : (
                  "Sign In"
                )}
              </MagneticButton>
            </form>

            {/* Toggle Signin/Signup */}
            <div className="mt-6 text-center text-xs">
              <span className="text-zinc-500">
                {isSignUp ? "Already a member? " : "New to BookFlix? "}
              </span>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="font-bold text-rose-500 hover:text-rose-400 cursor-pointer"
              >
                {isSignUp ? "Sign In Now" : "Sign Up Now"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} BookFlix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
