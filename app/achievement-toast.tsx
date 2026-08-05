"use client";

import { useEffect, useState } from "react";

type Toast = { id: string; title: string; reward: number };

export default function AchievementToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onUnlocked = (event: Event) => {
      const detail = (event as CustomEvent<Toast>).detail;
      if (!detail) return;
      setToasts((current) => [...current, { ...detail, id: `${detail.id}-${Date.now()}` }]);
    };
    window.addEventListener("achievement-unlocked", onUnlocked);
    return () => window.removeEventListener("achievement-unlocked", onUnlocked);
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timer = window.setTimeout(() => setToasts((current) => current.slice(1)), 4400);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  return <div className="achievement-toasts" aria-live="polite">{toasts.map((toast) => <div className="achievement-toast" key={toast.id}><span aria-hidden="true">★</span><div><small>Achievement unlocked</small><strong>{toast.title}</strong></div><b>+{toast.reward} pts</b></div>)}</div>;
}
