"use client";

// Top-level game UI: menu / playing / game-over states around the canvas engine.

import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/constants";
import { assets } from "@/game/assets.manager";
import { audio } from "@/game/audio.manager";
import { GameEngine, RunStats } from "@/game/engine";
import {
  fetchLeaderboard,
  LeaderboardEntry,
  submitScore,
} from "@/lib/leaderboard.client";

type Screen = "loading" | "menu" | "playing" | "gameover";

export default function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screen, setScreen] = useState<Screen>("loading");
  const [playerName, setPlayerName] = useState("");
  const [muted, setMuted] = useState(false);
  const [stats, setStats] = useState<RunStats | null>(null);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [shareLabel, setShareLabel] = useState("Partager 🔗");

  // Boot: load assets, restore prefs, prefetch leaderboard
  useEffect(() => {
    audio.init();
    setMuted(audio.muted);
    setPlayerName(localStorage.getItem("rr2.name") ?? "");
    setBest(Number(localStorage.getItem("rr2.best") ?? 0));
    assets.loadAll().then(() => setScreen("menu"));
    fetchLeaderboard().then(setBoard);
    return () => engineRef.current?.destroy();
  }, []);

  const handleGameOver = useCallback(
    async (runStats: RunStats) => {
      engineRef.current?.destroy();
      engineRef.current = null;
      setStats(runStats);
      setRank(null);

      const prevBest = Number(localStorage.getItem("rr2.best") ?? 0);
      const newBest = runStats.score > prevBest;
      setIsNewBest(newBest);
      if (newBest) {
        localStorage.setItem("rr2.best", String(runStats.score));
        setBest(runStats.score);
      }
      setScreen("gameover");

      // Push to global leaderboard (name is required by the API)
      const name = (localStorage.getItem("rr2.name") ?? "").trim();
      if (name && runStats.score > 0) {
        const result = await submitScore({
          name,
          score: runStats.score,
          distance: runStats.distanceM,
          maxCombo: runStats.maxCombo,
        });
        if (result) {
          setRank(result.rank);
          setBoard(result.entries);
        }
      } else {
        fetchLeaderboard().then(setBoard);
      }
    },
    []
  );

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || engineRef.current) return;
    localStorage.setItem("rr2.name", playerName.trim());
    setStats(null);
    setScreen("playing");
    const engine = new GameEngine(canvas, handleGameOver);
    engineRef.current = engine;
    engine.start();
  }, [playerName, handleGameOver]);

  // Space restarts from the game-over screen — "one more run" friction: zero
  useEffect(() => {
    if (screen !== "gameover" && screen !== "menu") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT") return;
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, startGame]);

  const toggleMute = () => setMuted(audio.toggleMute());

  const share = async () => {
    if (!stats) return;
    const text = `🦄 J'ai marqué ${stats.score.toLocaleString("fr-FR")} points sur ${stats.distanceM} m dans Rainbow Racer ! Tu peux me battre ? 🌈`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Rainbow Racer", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareLabel("Copié ! ✅");
        setTimeout(() => setShareLabel("Partager 🔗"), 2000);
      }
    } catch {
      // user cancelled share sheet — fine
    }
  };

  const myName = playerName.trim();

  return (
    <div className="shell">
      <div className="stage">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="game-canvas"
        />

        {screen === "loading" && (
          <div className="overlay">
            <p className="loading-text">Chargement des arcs-en-ciel… 🌈</p>
          </div>
        )}

        {screen === "menu" && (
          <div className="overlay menu">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/Logo.png" alt="Rainbow Racer" className="logo" />
            <p className="tagline">Prism Rush — vole, frôle, enchaîne les combos.</p>

            <input
              className="name-input"
              type="text"
              maxLength={16}
              placeholder="Ton pseudo pour le classement"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button className="play-btn" onClick={startGame}>
              JOUER&nbsp;&nbsp;▶
            </button>

            <div className="help">
              <span><kbd>Espace</kbd> battre des ailes · maintenir = planer</span>
              <span><kbd>Shift</kbd> dash (invincible) · <kbd>B</kbd> Cacalicorne 💩</span>
              <span>🌈 arc-en-ciel = Rainbow Rush · frôle les nuages = bonus</span>
            </div>

            {best > 0 && <p className="best">Record perso : {best.toLocaleString("fr-FR")} — ton fantôme t&apos;attend 👻</p>}

            {board.length > 0 && (
              <div className="board mini">
                <h3>🏆 Top pilotes</h3>
                <ol>
                  {board.slice(0, 5).map((e, i) => (
                    <li key={i} className={e.name === myName ? "me" : ""}>
                      <span className="board-name">{e.name}</span>
                      <span className="board-score">{e.score.toLocaleString("fr-FR")}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {screen === "gameover" && stats && (
          <div className="overlay gameover">
            <h2 className="go-title">{isNewBest ? "🎉 NOUVEAU RECORD !" : "Fin du vol !"}</h2>
            <p className="go-score">{stats.score.toLocaleString("fr-FR")}</p>
            {rank !== null && rank > 0 && (
              <p className="go-rank">#{rank} au classement mondial 🌍</p>
            )}

            <div className="stats-grid">
              <div><span>{stats.distanceM} m</span><label>distance</label></div>
              <div><span>x{stats.maxCombo}</span><label>combo max</label></div>
              <div><span>{stats.gems}</span><label>gemmes</label></div>
              <div><span>{stats.rushes}</span><label>rushes 🌈</label></div>
            </div>

            <div className="go-actions">
              <button className="play-btn" onClick={startGame}>
                REVOLER&nbsp;&nbsp;↻&nbsp;<small>(Espace)</small>
              </button>
              <button className="secondary-btn" onClick={share}>{shareLabel}</button>
              <button className="secondary-btn" onClick={() => setScreen("menu")}>Menu</button>
            </div>

            {board.length > 0 && (
              <div className="board">
                <h3>🏆 Classement mondial</h3>
                <ol>
                  {board.slice(0, 10).map((e, i) => (
                    <li key={i} className={e.name === myName ? "me" : ""}>
                      <span className="board-rank">{i + 1}</span>
                      <span className="board-name">{e.name}</span>
                      <span className="board-score">{e.score.toLocaleString("fr-FR")}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <button className="mute-btn" onClick={toggleMute} aria-label="Couper le son">
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}
