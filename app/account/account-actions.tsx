"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";

export default function AccountActions() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  return <div className="account-actions">
    {signedIn ? <a className="button button-metal button-compact" href="/profile">Profile</a> : <>
      <a className="button button-dark" href="/account?tab=login">Login</a>
      <a className="button button-metal button-compact" href="/account?tab=create">Create account</a>
    </>}
  </div>;
}
