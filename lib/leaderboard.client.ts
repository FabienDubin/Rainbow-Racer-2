// Client helpers for the leaderboard API.

export interface LeaderboardEntry {
  name: string;
  score: number;
  distance: number;
  maxCombo: number;
  createdAt: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export async function submitScore(entry: {
  name: string;
  score: number;
  distance: number;
  maxCombo: number;
}): Promise<{ rank: number | null; entries: LeaderboardEntry[]; week?: string } | null> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { rank: data.rank ?? null, entries: data.entries ?? [], week: data.week };
  } catch {
    return null;
  }
}
