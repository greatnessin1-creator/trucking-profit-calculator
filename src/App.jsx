import React, { useEffect, useState } from "react";
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
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || null,
            },
          },
        });

        if (error) throw error;

        setMessage("Signup successful. You can now log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
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
            : "Start your 7-day TRIAL ONLY access."}
        </p>

        <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              mode === "login" ? "bg-slate-900 text-white" : "text-slate-700"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
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

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await loadUserState(session.user.id);
      } else {
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await loadUserState(session.user.id);
      } else {
        setProfile(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const loadUserState = async (userId) => {
    setLoading(true);

    const [{ data: profileData }, { data: subscriptionData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setProfile(profileData || null);
    setSubscription(subscriptionData || null);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  if (!session) {
    return <AuthScreen />;
  }

  const isTrial =
    subscription?.plan_name === "trial" ||
    subscription?.status === "trialing";

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
              {profile?.email || session.user.email} ·{" "}
              {subscription?.plan_name || "trial"}
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

      <TruckingProfitCalculator />
    </div>
  );
}
