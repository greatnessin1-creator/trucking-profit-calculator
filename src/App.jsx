import React, { useEffect, useRef, useState } from "react";
import TruckingProfitCalculator from "./truckingProfitCalculator";
import { supabase } from "./lib/supabase";

const SESSION_CACHE_KEY = "trucking_profit_last_session_hint_v1";

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

        if (data?.user && !data?.session) {
          setMessage("Account created. Check your email to confirm your account, then log in.");
        } else {
          setMessage("Account created successfully. You are now signed in.");
        }

        setMode("login");
        setShowPassword(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session?.user) {
          localStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify({
              id: data.session.user.id,
              email: data.session.user.email || "",
              full_name: data.session.user.user_metadata?.full_name || "",
              ts: Date.now(),
            })
          );
        }
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
              setShowPassword(false);
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
              setShowPassword(false);
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

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-20 outline-none focus:border-slate-500"
                placeholder="Password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
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

function readCachedSessionHint() {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedSessionHint(user) {
  if (!user?.id) return;
  try {
    localStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
        ts: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

function clearCachedSessionHint() {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // ignore
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(() => {
    const cached = readCachedSessionHint();
    return cached
      ? {
          id: cached.id,
          email: cached.email || "",
          full_name: cached.full_name || "",
        }
      : null;
  });
  const [subscription, setSubscription] = useState(null);
  const [booting, setBooting] = useState(true);
  const [appError, setAppError] = useState("");
  const [hydratingUserState, setHydratingUserState] = useState(false);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const bootResolvedRef = useRef(false);

  const resetUserState = () => {
    setProfile(null);
    setSubscription(null);
    clearCachedSessionHint();
  };

  const safeStopBoot = () => {
    if (!bootResolvedRef.current && mountedRef.current) {
      bootResolvedRef.current = true;
      setBooting(false);
    }
  };

  const loadUserState = async (user) => {
    if (!user?.id) {
      setHydratingUserState(false);
      setSubscription(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setHydratingUserState(true);

    const fallbackProfile = {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || "",
    };

    setProfile(fallbackProfile);
    writeCachedSessionHint(user);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("User state sync timed out.")), 7000)
      );

      const fetchPromise = Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const [profileResult, subscriptionResult] = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (profileResult?.error) throw profileResult.error;
      if (subscriptionResult?.error) throw subscriptionResult.error;

      setProfile(profileResult?.data || fallbackProfile);
      setSubscription(subscriptionResult?.data || null);
      setAppError("");
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      console.error("loadUserState error:", err);
      setProfile(fallbackProfile);
      setSubscription(null);
      setAppError(err?.message || "Failed to sync user data.");
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setHydratingUserState(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    bootResolvedRef.current = false;

    const bootTimeout = setTimeout(() => {
      safeStopBoot();
    }, 3500);

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mountedRef.current) return;

      setSession(newSession);

      if (newSession?.user) {
        setProfile({
          id: newSession.user.id,
          email: newSession.user.email || "",
          full_name: newSession.user.user_metadata?.full_name || "",
        });
        writeCachedSessionHint(newSession.user);
        loadUserState(newSession.user);
      } else {
        resetUserState();
      }

      safeStopBoot();
    });

    (async () => {
      try {
        const sessionTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Session bootstrap timed out.")), 3000)
        );

        const sessionFetch = supabase.auth.getSession();

        const result = await Promise.race([sessionFetch, sessionTimeout]);

        if (!mountedRef.current) return;

        const {
          data: { session },
          error,
        } = result;

        if (error) throw error;

        setSession(session);

        if (session?.user) {
          setProfile({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || "",
          });
          writeCachedSessionHint(session.user);
          loadUserState(session.user);
        } else {
          resetUserState();
        }
      } catch (err) {
        if (!mountedRef.current) return;

        console.error("Session bootstrap error:", err);
        setAppError(err?.message || "Failed to restore session.");
      } finally {
        safeStopBoot();
      }
    })();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && session?.user) {
        loadUserState(session.user);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      clearTimeout(bootTimeout);
      authListener?.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      resetUserState();
      setHydratingUserState(false);
      setBooting(false);
    }
  };

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow">
          Loading...
        </div>
      </div>
    );
  }

  if (!session && !profile) {
    return <AuthScreen />;
  }

  const planName = subscription?.plan_name || "trial";
  const activeEmail = profile?.email || session?.user?.email || "Signed in user";
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
              {activeEmail} · {planName}
              {hydratingUserState ? " · syncing..." : ""}
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

      {appError ? (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {appError}
          </div>
        </div>
      ) : null}

      <TruckingProfitCalculator
        session={session}
        profile={profile}
        subscription={subscription}
        isTrial={isTrial}
      />
    </div>
  );
}
