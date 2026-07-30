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

const MAX_ENTRIES = 100;
const MAX_PLAUSIBLE_SCORE = 1_000_000; // sanity clamp against trivial cheating
const FILE_PATH = path.join(process.cwd(), ".data", "leaderboard.json");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project"));

// ---------------- File backend ----------------
async function fileRead(): Promise<ScoreEntry[]> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as ScoreEntry[];
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
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scores?select=name,score,distance,max_combo,created_at&order=score.desc&limit=${MAX_ENTRIES}`,
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
    const entries = useSupabase ? await supabaseRead() : await fileRead();
    return NextResponse.json({ entries: entries.slice(0, MAX_ENTRIES), backend: useSupabase ? "supabase" : "file" });
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
      const entries = await supabaseRead();
      const rank = entries.findIndex((e) => e.score <= entry.score) + 1 || entries.length;
      return NextResponse.json({ ok: true, rank, entries });
    }

    const entries = await fileRead();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, MAX_ENTRIES);
    await fileWrite(trimmed);
    const rank = trimmed.findIndex((e) => e === entry) + 1;
    return NextResponse.json({ ok: true, rank: rank || null, entries: trimmed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "submit_failed" }, { status: 500 });
  }
}
