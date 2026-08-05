import ProfilePanel from "./profile-panel";
import "./profile.css";
import AccountActions from "../account/account-actions";

export const metadata = { title: "My Legacy — Build a Beauty" };
export default function ProfilePage() { return <main className="profile-shell"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">BB</span><span className="brand-copy"><strong>Build a Beauty</strong><small>Legacy Builder</small></span></a><nav className="main-nav"><a href="/play">Play</a><a href="/achievements">Achievements</a><a href="/#leaderboard">Leaderboard</a></nav><AccountActions /></header><div className="profile-page"><ProfilePanel /></div></main>; }
