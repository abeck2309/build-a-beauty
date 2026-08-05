import AccountActions from "../account/account-actions";
import AchievementBoard from "./achievement-board";
import "./achievements.css";

export const metadata = { title: "Achievements — Build a Beauty", description: "Track your Build a Beauty legacy." };

export default function AchievementsPage() {
  return <main className="achievements-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Build a Beauty home"><span className="brand-mark" aria-hidden="true">BB</span><span className="brand-copy"><strong>Build a Beauty</strong><small>Legacy Builder</small></span></a>
      <nav className="main-nav" aria-label="Primary navigation"><a href="/play">Play</a><a className="nav-active" href="/achievements">Achievements</a><a href="/#leaderboard">Leaderboard</a></nav>
      <AccountActions />
    </header>
    <AchievementBoard />
  </main>;
}
