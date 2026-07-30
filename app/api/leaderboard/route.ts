// Global leaderboard API.
// Storage backends, picked automatically:
//  - Supabase (if NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY are set) → production, global
//  - Local JSON file (.data/leaderboard.json) → dev / self-hosted fallback
// Supabase is called through its REST API with plain fetch: zero extra dependency.

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export interface ScoreEntry {
  name: string;
  score: number;
  distance: number;
  maxCombo: number;
  createdAt: string;
}

// The board resets every Monday. An all-time board is dead on arrival for a newcomer: they
// see a number they will never reach, understand they cannot compete, and leave. A weekly
// reset gives everybody a shot at being first THIS WEEK, which is the difference between a
// decorative table and a reason to come back.
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // ISO week: Thursday of the current week determines the year and week number
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const MAX_ENTRIES = 100;
const MAX_PLAUSIBLE_SCORE = 1_000_000; // sanity clamp against trivial cheating
const FILE_PATH = path.join(process.cwd(), ".data", "leaderboard.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project"));

// The `scores` table has RLS on with no policy, so ONLY a secret key gets through. A
// publishable/anon key produces the worst possible failure: reads return HTTP 200 with an
// empty array (no rows are visible to it) while writes 401, so the board looks like it works
// and is simply always empty. Fab hit exactly this. Say it out loud instead.
if (useSupabase && /^sb_publishable|^sbp_/.test(SUPABASE_KEY!)) {
  console.error(
    "[leaderboard] SUPABASE_SECRET_KEY holds a PUBLISHABLE key. RLS will block every insert " +
      "and reads will silently return nothing. Use the secret key (service_role / sb_secret_...)."
  );
}

// ---------------- File backend ----------------
async function fileRead(): Promise<ScoreEntry[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const all = JSON.parse(raw) as ScoreEntry[];
    // Filter rather than delete, so history survives a reset
    const week = weekKey();
    return all.filter((e) => weekKey(new Date(e.createdAt)) === week);
  } catch {
    return [];
  }
}

async function fileReadAll(): Promise<ScoreEntry[]> {
  try {
    return JSON.parse(await fs.readFile(FILE_PATH, "utf8")) as ScoreEntry[];
  } catch {
    return [];
  }
}

async function fileWrite(entries: ScoreEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(entries, null, 2), "utf8");
}

// ---------------- Supabase backend ----------------
// Expected table:  create table scores (id bigint generated always as identity primary key,
//   name text not null, score int not null, distance int not null,
//   max_combo int not null, created_at timestamptz default now());
async function supabaseRead(): Promise<ScoreEntry[]> {
  // Only this week's rows; the reset is a filter, not a delete
  const monday = new Date();
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1));
  monday.setUTCHours(0, 0, 0, 0);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?select=name,score,distance,max_combo,created_at` +
      `&created_at=gte.${monday.toISOString()}&order=score.desc&limit=500`,
    { headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Supabase read failed: ${res.status}`);
  const rows = (await res.json()) as { name: string; score: number; distance: number; max_combo: number; created_at: string }[];
  return rows.map((r) => ({
    name: r.name, score: r.score, distance: r.distance,
    maxCombo: r.max_combo, createdAt: r.created_at,
  }));
}

async function supabaseInsert(entry: ScoreEntry): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      name: entry.name, score: entry.score, distance: entry.distance, max_combo: entry.maxCombo,
    }),
  });
  if (!res.ok) throw new Error(`Supabase insert failed: ${res.status}`);
}

// ---------------- Handlers ----------------
export async function GET(): Promise<NextResponse> {
  try {
    const raw = useSupabase ? await supabaseRead() : await fileRead();
    // One row per player: their best of the week
    const best = new Map<string, ScoreEntry>();
    for (const e of raw) {
      const prev = best.get(e.name);
      if (!prev || e.score > prev.score) best.set(e.name, e);
    }
    const entries = [...best.values()].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
    return NextResponse.json({
      entries,
      week: weekKey(),
      backend: useSupabase ? "supabase" : "file",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ entries: [], error: "leaderboard_unavailable" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().slice(0, 16).replace(/[<>]/g, "");
    const score = Math.round(Number(body.score));
    const distance = Math.round(Number(body.distance));
    const maxCombo = Math.round(Number(body.maxCombo));

    if (!name || !Number.isFinite(score) || score <= 0 || score > MAX_PLAUSIBLE_SCORE) {
      return NextResponse.json({ error: "invalid_entry" }, { status: 400 });
    }

    const entry: ScoreEntry = {
      name,
      score,
      distance: Number.isFinite(distance) ? distance : 0,
      maxCombo: Number.isFinite(maxCombo) ? maxCombo : 0,
      createdAt: new Date().toISOString(),
    };

    if (useSupabase) {
      await supabaseInsert(entry);
      const rows = await supabaseRead();
      const best = new Map<string, ScoreEntry>();
      for (const e of rows) {
        const prev = best.get(e.name);
        if (!prev || e.score > prev.score) best.set(e.name, e);
      }
      const entries = [...best.values()].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
      const rank = entries.findIndex((e) => e.name === entry.name) + 1;
      return NextResponse.json({ ok: true, rank: rank || null, week: weekKey(), entries });
    }

    const all = await fileReadAll();
    all.push(entry);
    // Keep only one best score per name per week, so the board reads as people not attempts
    const week = weekKey();
    const thisWeek = all.filter((e) => weekKey(new Date(e.createdAt)) === week);
    const best = new Map<string, ScoreEntry>();
    for (const e of thisWeek) {
      const prev = best.get(e.name);
      if (!prev || e.score > prev.score) best.set(e.name, e);
    }
    const board = [...best.values()].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
    await fileWrite([...all.filter((e) => weekKey(new Date(e.createdAt)) !== week), ...thisWeek]);
    // Rank by NAME, not by this attempt's score: a run that fails to beat your own best
    // should still tell you where your best sits, rather than reporting no rank at all.
    const rank = board.findIndex((e) => e.name === entry.name) + 1;
    return NextResponse.json({ ok: true, rank: rank || null, week, entries: board });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "submit_failed" }, { status: 500 });
  }
}
