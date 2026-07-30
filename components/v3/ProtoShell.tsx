"use client";

// Prototype harness. Deliberately ugly: what is being tested is the mechanics, not the
// look. One page, growing phase by phase — there is nothing to switch between.
//
// End-of-run flow is stats -> lottery -> shop -> replay. The lottery sits there on
// purpose: every run then ends on a reward rather than a plain failure, and it is the
// last thing you see before pressing Rejouer.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProtoEngine, ProtoStats } from "@/game/v3/proto.engine";
import { skyAt } from "@/game/v3/art/palette";
import { drawAnchor, drawDustMote, drawParallax, drawSky } from "@/game/v3/art/draw";
import ShopIcon from "./ShopIcon";
import { audio } from "@/game/v3/audio";
import {
  fetchLeaderboard,
  LeaderboardEntry,
  submitScore,
} from "@/lib/leaderboard.client";
import {
  applyCard,
  buy,
  byId,
  CATALOGUE,
  configFor,
  LotteryCard,
  loadMeta,
  MetaState,
  recordRun,
  resetMeta,
  runScore,
  rollLottery,
  saveMeta,
  startRun,
  Upgrade,
} from "@/game/v3/meta";

// The lottery gets a screen of its own. Cards, score, board and actions on one page made
// the gamble just another widget in a stack; separated, picking a card is a moment.
type Screen = "menu" | "playing" | "lottery" | "summary" | "shop" | "board";

export default function ProtoShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ProtoEngine | null>(null);

  const [screen, setScreen] = useState<Screen>("menu");
  const [stats, setStats] = useState<ProtoStats | null>(null);
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [cards, setCards] = useState<LotteryCard[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [shareLabel, setShareLabel] = useState("Partager");
  const [nameDraft, setNameDraft] = useState("");
  // Keyboard hints are noise on a phone, where there is no Enter key to press
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);
  const enterHint = isTouch ? null : <small>(Entrée)</small>;

  useEffect(() => {
    audio.init();
    setMuted(audio.muted);
  }, []);

  useEffect(() => {
    const m = loadMeta();
    setMeta(m);
    setNameDraft(m.name);
  }, []);
  useEffect(() => {
    fetchLeaderboard().then(setBoard);
  }, []);
  useEffect(() => () => engineRef.current?.destroy(), []);

  // The menus used to sit on a black rectangle, which made the opening look unfinished.
  // This drifts the actual world behind them — sky, hills, prisms, dust — climbing slowly
  // through the altitude bands so you see what the game looks like before you press play.
  useEffect(() => {
    if (screen === "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const boxW = canvas.clientWidth || 540;
    const boxH = canvas.clientHeight || 960;
    const W = 540;
    const H = Math.round(W * (boxH / boxW));
    canvas.width = W;
    canvas.height = H;

    // A fixed scatter, so the backdrop is stable rather than sparkling randomly
    const props = Array.from({ length: 22 }, (_, i) => ({
      x: 40 + ((i * 137) % (W - 80)),
      y: (i * 233) % 2400,
      anchor: i % 3 === 0,
      skip: i % 9 === 0,
    }));

    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      // A slow, endless climb through the bands
      const camY = t * 90;
      const sky = skyAt(camY / 30 + 40);
      const cam = {
        camY,
        viewW: W,
        viewH: H,
        toScreen: (worldY: number) => H / 2 - (worldY - camY),
      };
      drawSky(ctx, cam, sky, t);
      drawParallax(ctx, cam, sky);
      for (const p of props) {
        // Wrap each prop through a tall band so the field never runs out
        const wrapped = ((p.y - camY) % 2400 + 2400) % 2400;
        const sy = H / 2 - (wrapped - 1200);
        if (sy < -40 || sy > H + 40) continue;
        if (p.anchor) drawAnchor(ctx, p.x, sy, sky.light, false, false, p.skip, t);
        else drawDustMote(ctx, p.x, sy, t);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  const persist = useCallback((next: MetaState) => {
    setMeta(next);
    saveMeta(next);
    return next;
  }, []);

  const handleEnd = useCallback(
    (s: ProtoStats) => {
      engineRef.current?.destroy();
      engineRef.current = null;
      setStats(s);
      const banked = recordRun(loadMeta(), s.dust, s.altitudeM);
      persist(banked);
      setCards(rollLottery(s.dust, banked));
      setPicked(null);
      setScreen("lottery");
      setRank(null);
      // A different, slower piece for the screens after a run
      audio.startMusic("aftermath");

      // Weekly board: only submit when they have chosen a name
      const score = runScore(s);
      if (banked.name && score > 0) {
        submitScore({
          name: banked.name,
          score,
          distance: s.altitudeM,
          maxCombo: s.bestChain,
        }).then((res) => {
          if (!res) return;
          setRank(res.rank);
          setBoard(res.entries);
        });
      }
    },
    [persist]
  );

  const play = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    engineRef.current?.destroy();
    // Consumables are spent and a mode burns one of its runs at the moment of launching
    const armed = loadMeta();
    const cfg = configFor(armed);
    persist(startRun(armed));
    setStats(null);
    setScreen("playing");
    const engine = new ProtoEngine(canvas, handleEnd, cfg);
    engineRef.current = engine;
    engine.start();
  }, [handleEnd, persist]);

  const pickCard = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    audio.cardFlip();
    // The celebration is bigger when the card you turned actually held the gift
    window.setTimeout(() => (cards[i].gift ? audio.giftFanfare() : audio.reward()), 180);
    // Cadence follows whether a gift was on the TABLE, not whether this card had it
    persist(applyCard(loadMeta(), cards[i], cards.some((c) => c.gift !== null)));
    // Let the reveal land before moving on
    window.setTimeout(() => setScreen("summary"), 1250);
  };

  // Enter advances the end-of-run flow, so "one more run" stays one key away
  useEffect(() => {
    if (screen === "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Enter") return;
      e.preventDefault();
      if (screen === "lottery") return; // the card pick is the only way past it
      if (screen === "board") return;
      play();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, picked, play]);

  const armedNames = useMemo(
    () => meta.consumables.map((id) => byId(id)?.name).filter(Boolean) as string[],
    [meta.consumables]
  );

  // Claiming a name after the fact: save it, then submit the run that has just ended
  const claimName = () => {
    const name = nameDraft.trim();
    if (!name || !stats) return;
    audio.uiClick();
    persist({ ...loadMeta(), name });
    const score = runScore(stats);
    if (score > 0) {
      submitScore({
        name,
        score,
        distance: stats.altitudeM,
        maxCombo: stats.bestChain,
      }).then((res) => {
        if (!res) return;
        setRank(res.rank);
        setBoard(res.entries);
      });
    }
  };

  // One place adds sound to a control, so no button can be forgotten
  const sfx = {
    onPointerEnter: () => audio.uiHover(),
    onPointerDown: () => audio.uiClick(),
  };

  const owned = (u: Upgrade) =>
    (u.kind === "permanent" && meta.permanents.includes(u.id)) ||
    (u.kind === "consumable" && meta.consumables.includes(u.id));

  return (
    <div className="proto-shell">
      <aside className="proto-aside">
        <p className="proto-aside-title">Rainbow Racer — L&apos;Ascension</p>
        <dl className="proto-legend">
          <dt>Appuyer</dt>
          <dd>s&apos;accrocher à l&apos;ancre la plus proche</dd>
          <dt>Maintenir</dt>
          <dd>le treuil enroule, le pendule prend de la vitesse</dd>
          <dt>Lâcher</dt>
          <dd>catapulte le long de la tangente</dd>
          <dt>Repères ⊥</dt>
          <dd>là où ta vitesse pointe droit vers le haut</dd>
          <dt>Plonger</dt>
          <dd>arriver vite sur une ancre basse relance plus haut</dd>
          <dt>Poussière</dt>
          <dd>
            les points suivent la route, les guirlandes valent double mais sont hors ligne
          </dd>
          <dt>Guirlandes</dt>
          <dd>
            s&apos;accrocher <b>de loin</b> garde la corde longue et les balaie ; de près
            on monte mieux mais on les rate
          </dd>
          <dt>Paliers</dt>
          <dd>de plus en plus espacés ; les franchir repousse l&apos;orage</dd>
          <dt>Éclairs</dt>
          <dd>le nuage clignote, puis sa ligne frappe</dd>
          <dt>Bourrasques</dt>
          <dd>elles ne blessent pas, elles poussent — recalcule ton point de lâcher</dd>
          <dt>Pilleurs</dt>
          <dd>les pies volent ta poussière et brisent ta chaîne</dd>
        </dl>
        <p className="proto-aside-note">
          Tout est dessiné en vectoriel, généré à l&apos;image — Prism comprise. Sa crinière
          et la corde sont la même matière.
        </p>
      </aside>

      <div className="proto-stage">
        <canvas ref={canvasRef} className="proto-canvas" />

        <button
          className="proto-mute"
          onClick={() => setMuted(audio.toggleMute())}
          aria-label={muted ? "Activer le son" : "Couper le son"}
        >
          {muted ? "♪̶" : "♪"}
        </button>

        {screen !== "playing" && (
          <div className="proto-overlay">
            {screen === "menu" && (
              <>
                <p className="proto-title">
                  RAINBOW RACER
                  <br />
                  L&apos;ASCENSION
                </p>
                {/* One line, not five. Everything else is learnable by playing, and a wall
                    of rules on the opening screen is the fastest way to not be played. */}
                <p className="proto-pitch">
                  Accroche-toi, balance-toi, lâche au bon moment.
                  <br />
                  Ramasse la poussière et grimpe avant l&apos;orage.
                </p>

                <p className="proto-dust">
                  <ShopIcon id="dust" size={18} /> {meta.dust}
                </p>

                <input
                  className="proto-name"
                  type="text"
                  maxLength={16}
                  placeholder="ton pseudo"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => persist({ ...loadMeta(), name: nameDraft.trim() })}
                />
                <button
                  className="proto-btn"
                  {...sfx}
                  onClick={() => {
                    persist({ ...loadMeta(), name: nameDraft.trim() });
                    play();
                  }}
                >
                  Jouer
                </button>

                {armedNames.length > 0 && (
                  <p className="proto-armed">équipé : {armedNames.join(" · ")}</p>
                )}
                {meta.modeRunsLeft > 0 && meta.mode && (
                  <p className="proto-armed">
                    mode {byId(meta.mode)?.name} — {meta.modeRunsLeft} run
                    {meta.modeRunsLeft > 1 ? "s" : ""}
                  </p>
                )}

                <div className="proto-actions-row">
                  {meta.dust > 0 && (
                    <button
                      className="proto-btn-ghost"
                      onClick={() => setScreen("shop")}
                      {...sfx}
                    >
                      Boutique
                    </button>
                  )}
                  {board.length > 0 && (
                    <button
                      className="proto-btn-ghost"
                      onClick={() => setScreen("board")}
                      {...sfx}
                    >
                      Classement
                    </button>
                  )}
                </div>

                {board.length > 0 && (
                  <ol className="proto-podium proto-podium--menu">
                    {board.slice(0, 3).map((e, i) => (
                      <li key={i} className={e.name === meta.name ? "me" : ""}>
                        <span className="rk">{i + 1}</span>
                        <span className="nm">{e.name}</span>
                        <span className="sc">{e.score.toLocaleString("fr-FR")}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {meta.bestM > 0 && (
                  <p className="proto-best">
                    record perso : {meta.bestM} m · {meta.runs} runs
                  </p>
                )}
              </>
            )}

            {screen === "lottery" && stats && (
              <>
                <section className="proto-sec proto-sec--tall">
                  <h3>{picked === null ? "Choisis une carte" : ""}</h3>
                  <div className="proto-cards">
                    {cards.map((c, i) => (
                      <button
                        key={i}
                        className={`proto-card${picked === i ? " picked" : ""}${
                          picked !== null ? " revealed" : ""
                        }`}
                        onClick={() => pickCard(i)}
                        onPointerEnter={() => picked === null && audio.uiHover()}
                        disabled={picked !== null}
                      >
                        {picked === null ? (
                          <span className="proto-card-back">?</span>
                        ) : (
                          <>
                            <span className="proto-card-dust">✦ {c.dust}</span>
                            {c.gift && (
                              <span className="proto-card-gift">+ {byId(c.gift)?.name}</span>
                            )}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                  {picked === null && (
                    <p className="proto-empty">Une seule. Les trois se révèlent ensuite.</p>
                  )}
                </section>
              </>
            )}

            {screen === "summary" && stats && (
              <>
                <section className="proto-sec">
                  <h3>Ta montée</h3>
                  <p className="proto-alt">{stats.altitudeM} m</p>
                  <ul className="proto-stats">
                    <li>
                      paliers <b>{stats.checkpoints}</b>
                    </li>
                    <li>
                      chaîne max <b>{stats.bestChain}</b>
                    </li>
                    <li>
                      éclairs pris <b>{stats.hits}</b>
                    </li>
                    {stats.stolen > 0 && (
                      <li>
                        volé par les pies <b>−{stats.stolen}</b>
                      </li>
                    )}
                    <li>
                      poussière <b>✦ {stats.dust}</b>
                    </li>
                  </ul>
                </section>

                <section className="proto-sec">
                  <h3>Classement de la semaine</h3>

                  {!meta.name && stats.altitudeM > 0 ? (
                    <div className="proto-claim">
                      <p>Ton pseudo pour enregistrer ce score&nbsp;:</p>
                      <div className="proto-claim-row">
                        <input
                          className="proto-name"
                          type="text"
                          maxLength={16}
                          placeholder="pseudo"
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") claimName();
                          }}
                        />
                        <button
                          className="proto-btn-ghost"
                          {...sfx}
                          onClick={claimName}
                          disabled={!nameDraft.trim()}
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {rank !== null && rank > 0 && (
                        <p className="proto-rank">#{rank} cette semaine</p>
                      )}
                      {board.length > 0 ? (
                        <>
                          <ol className="proto-podium">
                            {board.slice(0, 3).map((e, i) => (
                              <li key={i} className={e.name === meta.name ? "me" : ""}>
                                <span className="rk">{i + 1}</span>
                                <span className="nm">{e.name}</span>
                                <span className="sc">{e.score.toLocaleString("fr-FR")}</span>
                              </li>
                            ))}
                            {rank !== null && rank > 3 && (
                              <li className="me apart">
                                <span className="rk">{rank}</span>
                                <span className="nm">{meta.name}</span>
                                <span className="sc">
                                  {(board[rank - 1]?.score ?? 0).toLocaleString("fr-FR")}
                                </span>
                              </li>
                            )}
                          </ol>
                          <button
                            className="proto-board-more"
                            {...sfx}
                            onClick={() => setScreen("board")}
                          >
                            voir tout le classement
                          </button>
                        </>
                      ) : (
                        <p className="proto-empty">
                          Personne cette semaine. La place est à prendre.
                        </p>
                      )}
                    </>
                  )}
                </section>

                <section className="proto-sec proto-actions">
                  <button className="proto-btn" onClick={play} {...sfx}>
                    Rejouer {enterHint}
                  </button>
                  <div className="proto-actions-row">
                    <button
                      className="proto-btn-ghost"
                      onClick={() => setScreen("shop")}
                      {...sfx}
                    >
                      Boutique · ✦ {meta.dust}
                    </button>
                    <button
                      className="proto-btn-ghost"
                      {...sfx}
                      onClick={async () => {
                        const text =
                          `🦄 ${stats.altitudeM} m dans Rainbow Racer` +
                          (rank ? ` — #${rank} cette semaine` : "") +
                          ". Tu me bats ? 🌈";
                        try {
                          if (navigator.share) {
                            await navigator.share({
                              title: "Rainbow Racer",
                              text,
                              url: location.href,
                            });
                          } else {
                            await navigator.clipboard.writeText(`${text} ${location.href}`);
                            setShareLabel("Copié");
                            setTimeout(() => setShareLabel("Partager"), 1800);
                          }
                        } catch {
                          /* share sheet dismissed */
                        }
                      }}
                    >
                      {shareLabel}
                    </button>
                  </div>
                </section>
              </>
            )}


            {screen === "board" && (
              <>
                <section className="proto-sec">
                  <h3>Classement de la semaine</h3>
                  {board.length > 0 ? (
                    <ol className="proto-fullboard">
                      {board.map((e, i) => (
                        <li key={i} className={e.name === meta.name ? "me" : ""}>
                          <span className="rk">{i + 1}</span>
                          <span className="nm">{e.name}</span>
                          <span className="sc">{e.score.toLocaleString("fr-FR")}</span>
                          <span className="ds">{e.distance} m</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="proto-empty">
                      Personne cette semaine. La place est à prendre.
                    </p>
                  )}
                  <p className="proto-empty">
                    Remis à zéro chaque lundi&nbsp;: tout le monde a sa chance.
                  </p>
                </section>
                <button
                  className="proto-btn"
                  {...sfx}
                  onClick={() => setScreen(stats ? "summary" : "menu")}
                >
                  Retour
                </button>
              </>
            )}
            {screen === "shop" && (
              <>
                <p className="proto-lottery-title">Boutique</p>
                <p className="proto-dust">
                  <ShopIcon id="dust" size={18} /> {meta.dust} poussière
                </p>
                <div className="proto-shop">
                  {(["permanent", "consumable", "mode"] as const).map((kind) => (
                    <div key={kind} className="proto-shop-group">
                      <h4>
                        {kind === "permanent"
                          ? "Pour toujours"
                          : kind === "consumable"
                            ? "Le prochain run"
                            : "3 runs"}
                      </h4>
                      {CATALOGUE.filter((u) => u.kind === kind).map((u) => {
                        const has = owned(u);
                        const active =
                          u.kind === "mode" &&
                          meta.mode === u.id &&
                          meta.modeRunsLeft > 0;
                        const can = !has && !active && meta.dust >= u.price;
                        return (
                          <button
                            key={u.id}
                            className={`proto-item${has || active ? " owned" : ""}`}
                            disabled={!can}
                            onPointerEnter={() => can && audio.uiHover()}
                            onClick={() => {
                              audio.purchase();
                              persist(buy(loadMeta(), u.id));
                            }}
                          >
                            <span className="proto-item-icon">
                              <ShopIcon id={u.id} />
                            </span>
                            <span className="proto-item-name">{u.name}</span>
                            <span className="proto-item-price">
                              {has ? "acquis" : active ? "actif" : `✦ ${u.price}`}
                            </span>
                            <span className="proto-item-blurb">{u.blurb}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <button className="proto-btn" onClick={play} {...sfx}>
                  Jouer {enterHint}
                </button>
                <button
                  className="proto-reset"
                  onClick={() => {
                    if (confirm("Effacer la poussière et les achats ?")) {
                      setMeta(resetMeta());
                    }
                  }}
                >
                  réinitialiser la progression
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
