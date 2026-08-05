"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "./supabase-client";
import { ensureProfile } from "./profile-service";

declare global {
  interface Window {
    turnstile?: { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export default function AccountForm() {
  const searchParams = useSearchParams();
  const [createMode, setCreateMode] = useState(() => searchParams.get("tab") !== "login");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileMount = useRef<HTMLDivElement>(null);
  const turnstileWidget = useRef<string | null>(null);
  useEffect(() => setCreateMode(searchParams.get("tab") !== "login"), [searchParams]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user.email) { await ensureProfile(data.session.user); setNotice(`Logged in as ${data.session.user.email}. Your profile is ready.`); }
    });
  }, []);
  useEffect(() => {
    if (!createMode || !turnstileSiteKey || !turnstileMount.current) return;
    const render = () => {
      if (!window.turnstile || !turnstileMount.current || turnstileWidget.current) return;
      turnstileWidget.current = window.turnstile.render(turnstileMount.current, {
        sitekey: turnstileSiteKey, theme: "dark", callback: (token: string) => setTurnstileToken(token), "expired-callback": () => setTurnstileToken(""), "error-callback": () => setTurnstileToken(""),
      });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile/"]');
    if (existing) { existing.addEventListener("load", render); render(); return () => existing.removeEventListener("load", render); }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true; script.defer = true; script.addEventListener("load", render); document.head.appendChild(script);
    return () => { script.removeEventListener("load", render); };
  }, [createMode]);
  const verb = createMode ? "Create account" : "Log in";
  const signInWithGoogle = async () => {
    if (!supabase) { setNotice("Supabase is not configured in this environment yet."); return; }
    setSubmitting(true); setNotice("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/account` } });
    if (error) { setSubmitting(false); setNotice(error.message); }
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) { setNotice("Supabase is not configured in this environment yet."); return; }
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    if (createMode && !turnstileToken) { setNotice("Complete the verification before creating your account."); return; }
    setSubmitting(true); setNotice("");
    const result = createMode
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/account?tab=login`, captchaToken: turnstileToken } })
      : await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (result.error) { setNotice(result.error.message); return; }
    if (result.data.user) await ensureProfile(result.data.user);
    setNotice(createMode ? "Account created. Check your inbox to confirm your email, then log in." : "You’re logged in. Your profile is ready.");
  };

  return <section className="account-page"><div className="account-card">
    <div className="account-card-heading"><div><p className="account-eyebrow">{createMode ? "Create account" : "Welcome back"}</p><h1>{createMode ? "Start your legacy" : "Continue your legacy"}</h1><p>Save runs, unlock achievements, climb the leaderboard, and share your profile.</p></div><a href="/" className="account-home">Home</a></div>
    <div className="account-tabs" role="tablist" aria-label="Account action"><button type="button" className={!createMode ? "is-active" : ""} onClick={() => { setCreateMode(false); setNotice(""); }}>Login</button><button type="button" className={createMode ? "is-active" : ""} onClick={() => { setCreateMode(true); setNotice(""); }}>Create</button></div>
    <button type="button" className="google-button" disabled={submitting} onClick={signInWithGoogle}><span aria-hidden="true">G</span>Continue with Google</button>
    <div className="account-divider"><span>or email</span></div>
    <form onSubmit={submit}>
      <label>Email<input name="email" type="email" placeholder="you@email.com" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" placeholder={createMode ? "At least 6 characters" : "Your password"} autoComplete={createMode ? "new-password" : "current-password"} minLength={6} required /></label>
      {createMode && <div className="turnstile-placeholder"><div ref={turnstileMount} /><small>{turnstileToken ? "Verification complete" : "Complete verification to continue"}</small></div>}
      <button className="account-submit" type="submit" disabled={submitting}>{submitting ? "Please wait" : verb}</button>
    </form>
    {notice && <p className="account-notice" role="status">{notice}</p>}
    <p className="account-switch">{createMode ? "Already have an account?" : "New to Build a Beauty?"} <button type="button" onClick={() => { setCreateMode(!createMode); setNotice(""); }}>{createMode ? "Login" : "Create an account"}</button></p>
  </div></section>;
}
