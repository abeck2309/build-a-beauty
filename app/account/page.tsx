import { Suspense } from "react";
import AccountForm from "./account-form";
import AccountActions from "./account-actions";
import "./account.css";

export const metadata = {
  title: "Account — Build a Beauty",
  description: "Create or access your Build a Beauty legacy.",
};

export default function AccountPage() {
  return <main className="account-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Build a Beauty home"><span className="brand-mark" aria-hidden="true">BB</span><span className="brand-copy"><strong>Build a Beauty</strong><small>Legacy Builder</small></span></a>
      <nav className="main-nav" aria-label="Primary navigation"><a href="/play">Play</a><a href="/achievements">Achievements</a><a href="/#leaderboard">Leaderboard</a></nav>
      <AccountActions />
    </header>
    <Suspense fallback={null}><AccountForm /></Suspense>
  </main>;
}
