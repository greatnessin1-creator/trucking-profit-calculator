import React, { useEffect, useRef, useState } from "react";
import TruckingProfitCalculator from "./truckingProfitCalculator";
import { supabase } from "./lib/supabase";

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || null,
            },
          },
        });

        if (error) throw error;

        // Supabase may require email confirmation depending on project settings
        if (data?.user && !data?.session) {
          setMessage("Account created. Check your email to confirm your account, then log in.");
        } else {
          setMessage("Account created successfully. You are now signed in.");
        }

        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "login" ? "Log in" : "Create account"}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          {mode === "login"
            ? "Access your trucking calculator account."
            : "Start your access and save your numbers."}
        </p>

        <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "login" ? "bg-slate-900 text-white" : "text-slate-700"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "signup" ? "bg-slate-900 text-white" : "text-slate-700"
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleAuth} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              placeholder="Password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log in"
              : "Create account"}
          </button>
        </form>

        {message && (
          <div className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

function TrialWatermark() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden opacity-10">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute left-[-10%] right-[-10%] text-center text-4xl font-extrabold tracking-[0.3em] text-slate-900"
          style={{
            top: `${8 + i * 12}%`,
            transform: "rotate(-28deg)",
          }}
        >
          TRIAL ONLY
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState("");
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const resetUserState = () => {
    setProfile(null);
    setSubscription(null);
  };

  const loadUserState = async (user) => {
    if (!user?.id) {
      resetUserState();
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setAppError("");

      const [profileResult, subscriptionResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (profileResult.error) throw profileResult.error;
      if (subscriptionResult.error) throw subscriptionResult.error;

      setProfile(profileResult.data || {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
      });

      setSubscription(subscriptionResult.data || null);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      console.error("loadUserState error:", err);
      setAppError(err?.message || "Failed to load user data.");
      setProfile({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
      });
      setSubscription(null);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        setLoading(true);
        setAppError("");

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mountedRef.current) return;

        setSession(session);

        if (session?.user) {
          await loadUserState(session.user);
        } else {
          resetUserState();
          setLoading(false);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setAppError(err?.message || "Failed to load session.");
        resetUserState();
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mountedRef.current) return;

      setSession(newSession);
      setAppError("");

      if (newSession?.user) {
        await loadUserState(newSession.user);
      } else {
        resetUserState();
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      authListener?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      resetUserState();
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow">
          Loading...
        </div>
      </div>
    );
  }

  if (appError && session) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-md">
          <h1 className="text-xl font-bold text-slate-900">App error</h1>
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {appError}
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  const planName = subscription?.plan_name || "trial";
  const isTrial =
    subscription?.plan_name === "trial" ||
    subscription?.status === "trialing" ||
    subscription == null;

  return (
    <div className="relative">
      {isTrial && <TrialWatermark />}

      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-bold text-slate-900">
              Trucking Profit Calculator
            </div>
            <div className="text-xs text-slate-500">
              {(profile?.email || session?.user?.email || "Signed in user")} · {planName}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </div>

      <TruckingProfitCalculator
        session={session}
        profile={profile}
        subscription={subscription}
        isTrial={isTrial}
      />
    </div>
  );
}
