"use client";

// Prototype harness. Deliberately ugly: what is being tested is the mechanics, not the
// look. One page, growing phase by phase — there is nothing to switch between.
//
// End-of-run flow is stats -> lottery -> shop -> replay. The lottery sits there on
// purpose: every run then ends on a reward rather than a plain failure, and it is the
// last thing you see before pressing Rejouer.

import { useCallback, useEffect, useRef, useState } from "react";

import { ProtoEngine, ProtoStats } from "@/game/v3/proto.engine";
import { skyAt } from "@/game/v3/art/palette";
import { drawAnchor, drawDustMote, drawParallax, drawSky } from "@/game/v3/art/draw";
import ShopIcon from "./ShopIcon";
import LangSwitch from "./LangSwitch";
import SettingsScreen from "./SettingsScreen";
import HowtoScreen from "./HowtoScreen";
import { useLocale } from "./useLocale";
import { useSettings } from "./useSettings";
import { formatNumber, t } from "@/game/v3/i18n";
import { loadSettings } from "@/game/v3/settings";
import { audio } from "@/game/v3/audio";
import {
  fetchLeaderboard,
  LeaderboardEntry,
  submitScore,
} from "@/lib/leaderboard.client";
import {
  applyCard,
  buy,
  CATALOGUE,
  configFor,
  itemBlurb,
  itemName,
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
type Screen =
  | "menu"
  | "playing"
  | "lottery"
  | "summary"
  | "shop"
  | "board"
  | "settings"
  | "howto";

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
  // What the CURRENT run is carrying, captured at launch and shown over the canvas.
  // Upgrade IDS, not names: a name is language-dependent and this survives a switch.
  const [boons, setBoons] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  // Where to go back to when the controls card is opened from somewhere other than the
  // start of a run. Null means "this is the pre-run card, start the run on dismiss".
  const [howtoReturn, setHowtoReturn] = useState<Screen | null>(null);
  // Re-renders this whole shell when the language or the settings change, which is what
  // makes every t() call below current and the settings screen live
  useLocale();
  useSettings();
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
    // Snapshot the boons BEFORE startRun() clears them. Fab won a gift and never knew:
    // it was announced for one second on a card, then spent by the next run in silence.
    setBoons([
      ...armed.consumables,
      ...(armed.modeRunsLeft > 0 && armed.mode ? [armed.mode] : []),
    ]);
    persist(startRun(armed));
    setStats(null);
    setScreen("playing");
    // Read straight from storage rather than from the subscribed value: play() is a
    // callback that can be a render behind, and a run must never start on stale sizes.
    const engine = new ProtoEngine(canvas, handleEnd, cfg, loadSettings());
    engineRef.current = engine;
    engine.start();
  }, [handleEnd, persist]);

  // A brand-new player gets the one-gesture card before their first world appears. The
  // game is a single verb and it punishes tapping harder than anything else, so nobody
  // should have to discover "hold, then let go" by losing with it.
  const requestPlay = useCallback(() => {
    if (loadMeta().runs === 0) {
      setHowtoReturn(null);
      setScreen("howto");
      return;
    }
    play();
  }, [play]);

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
      // These two have their own buttons and their own Enter meaning
      if (screen === "settings" || screen === "howto") return;
      requestPlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, picked, requestPlay]);

  // Translated at render, not memoised on the ids: switching language must relabel them
  const armedNames = meta.consumables.map(itemName);

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
        <p className="proto-aside-title">{t("aside.title")}</p>
        <dl className="proto-legend">
          <dt>{t("legend.press")}</dt>
          <dd>{t("legend.press.d")}</dd>
          <dt>{t("legend.hold")}</dt>
          <dd>{t("legend.hold.d")}</dd>
          <dt>{t("legend.release")}</dt>
          <dd>{t("legend.release.d")}</dd>
          <dt>{t("legend.marks")}</dt>
          <dd>{t("legend.marks.d")}</dd>
          <dt>{t("legend.dive")}</dt>
          <dd>{t("legend.dive.d")}</dd>
          <dt>{t("legend.dust")}</dt>
          <dd>{t("legend.dust.d")}</dd>
          <dt>{t("legend.garlands")}</dt>
          <dd>
            {t("legend.garlands.a")}
            <b>{t("legend.garlands.b")}</b>
            {t("legend.garlands.c")}
          </dd>
          <dt>{t("legend.paliers")}</dt>
          <dd>{t("legend.paliers.d")}</dd>
          <dt>{t("legend.bolts")}</dt>
          <dd>{t("legend.bolts.d")}</dd>
          <dt>{t("legend.gusts")}</dt>
          <dd>{t("legend.gusts.d")}</dd>
          <dt>{t("legend.raiders")}</dt>
          <dd>{t("legend.raiders.d")}</dd>
        </dl>
        <p className="proto-aside-note">{t("aside.note")}</p>
      </aside>

      <div className="proto-stage">
        <canvas ref={canvasRef} className="proto-canvas" />

        <button
          className="proto-mute"
          onClick={() => setMuted(audio.toggleMute())}
          aria-label={muted ? t("ui.unmute") : t("ui.mute")}
        >
          {muted ? "♪̶" : "♪"}
        </button>

        {/* Top-left, mirroring the sound button. Hidden during a run: the altitude
            readout lives in that corner, and nobody changes language mid-climb. */}
        {screen !== "playing" && <LangSwitch />}

        {/* In-run proof that the boon is real. It fades after a few seconds so it never
            competes with the game, but you SEE what you are carrying. */}
        {screen === "playing" && boons.length > 0 && (
          <p className="proto-boons" key={boons.join()}>
            {boons.map(itemName).join(" · ")}
          </p>
        )}

        {screen !== "playing" && (
          <div className="proto-overlay">
            {screen === "menu" && (
              <>
                <p className="proto-title">
                  {t("title.main")}
                  <br />
                  {t("title.sub")}
                </p>
                {/* One line, not five. Everything else is learnable by playing, and a wall
                    of rules on the opening screen is the fastest way to not be played. */}
                <p className="proto-pitch">
                  {t("menu.pitch1")}
                  <br />
                  {t("menu.pitch2")}
                </p>

                <p className="proto-dust">
                  <ShopIcon id="dust" size={18} /> {meta.dust}
                </p>

                <input
                  className="proto-name"
                  type="text"
                  maxLength={16}
                  placeholder={t("menu.namePlaceholder")}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => persist({ ...loadMeta(), name: nameDraft.trim() })}
                />
                <button
                  className="proto-btn"
                  {...sfx}
                  onClick={() => {
                    persist({ ...loadMeta(), name: nameDraft.trim() });
                    requestPlay();
                  }}
                >
                  {t("menu.play")}
                </button>

                {armedNames.length > 0 && (
                  <p className="proto-armed">
                    {t("menu.armed", { list: armedNames.join(" · ") })}
                  </p>
                )}
                {meta.modeRunsLeft > 0 && meta.mode && (
                  <p className="proto-armed">
                    {t(meta.modeRunsLeft > 1 ? "menu.mode.many" : "menu.mode.one", {
                      name: itemName(meta.mode),
                      n: meta.modeRunsLeft,
                    })}
                  </p>
                )}

                <div className="proto-actions-row">
                  {meta.dust > 0 && (
                    <button
                      className="proto-btn-ghost"
                      onClick={() => setScreen("shop")}
                      {...sfx}
                    >
                      {t("menu.shop")}
                    </button>
                  )}
                  {board.length > 0 && (
                    <button
                      className="proto-btn-ghost"
                      onClick={() => setScreen("board")}
                      {...sfx}
                    >
                      {t("menu.board")}
                    </button>
                  )}
                  <button
                    className="proto-btn-ghost"
                    onClick={() => setScreen("settings")}
                    {...sfx}
                  >
                    {t("settings.open")}
                  </button>
                </div>

                {board.length > 0 && (
                  <ol className="proto-podium proto-podium--menu">
                    {board.slice(0, 3).map((e, i) => (
                      <li key={i} className={e.name === meta.name ? "me" : ""}>
                        <span className="rk">{i + 1}</span>
                        <span className="nm">{e.name}</span>
                        <span className="sc">{formatNumber(e.score)}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {meta.bestM > 0 && (
                  <p className="proto-best">
                    {t(meta.runs > 1 ? "menu.best.many" : "menu.best.one", {
                      m: meta.bestM,
                      runs: meta.runs,
                    })}
                  </p>
                )}
              </>
            )}

            {screen === "lottery" && stats && (
              <>
                <section className="proto-sec proto-sec--tall proto-sec--draw">
                  <h2 className="proto-draw-title">
                    {picked === null ? t("lottery.pick") : t("lottery.reveal")}
                  </h2>
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
                              <span className="proto-card-gift">+ {itemName(c.gift)}</span>
                            )}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                  {/* One short line. It first stated the obvious ("pick one, the rest
                      reveal"), then listed what the shop sells — a catalogue nobody reads on
                      a reward screen. What it needs to say is simply where dust goes. */}
                  <p className="proto-hint">
                    <ShopIcon id="dust" size={15} />
                    <span>{t("lottery.hint")}</span>
                  </p>
                </section>
              </>
            )}

            {screen === "summary" && stats && (
              <>
                <section className="proto-sec">
                  <h3>{t("summary.title")}</h3>
                  <p className="proto-alt">{stats.altitudeM} m</p>
                  <ul className="proto-stats">
                    <li>
                      {t("summary.paliers")} <b>{stats.checkpoints}</b>
                    </li>
                    <li>
                      {t("summary.chain")} <b>{stats.bestChain}</b>
                    </li>
                    <li>
                      {t("summary.hits")} <b>{stats.hits}</b>
                    </li>
                    {stats.stolen > 0 && (
                      <li>
                        {t("summary.stolen")} <b>−{stats.stolen}</b>
                      </li>
                    )}
                    <li>
                      {t("summary.dust")} <b>✦ {stats.dust}</b>
                    </li>
                  </ul>
                </section>

                <section className="proto-sec">
                  <h3>{t("board.title")}</h3>

                  {!meta.name && stats.altitudeM > 0 ? (
                    <div className="proto-claim">
                      <p>{t("board.claim")}</p>
                      <div className="proto-claim-row">
                        <input
                          className="proto-name"
                          type="text"
                          maxLength={16}
                          placeholder={t("board.claimPlaceholder")}
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
                          {t("board.save")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {rank !== null && rank > 0 && (
                        <p className="proto-rank">{t("board.rank", { n: rank })}</p>
                      )}
                      {board.length > 0 ? (
                        <>
                          <ol className="proto-podium">
                            {board.slice(0, 3).map((e, i) => (
                              <li key={i} className={e.name === meta.name ? "me" : ""}>
                                <span className="rk">{i + 1}</span>
                                <span className="nm">{e.name}</span>
                                <span className="sc">{formatNumber(e.score)}</span>
                              </li>
                            ))}
                            {rank !== null && rank > 3 && (
                              <li className="me apart">
                                <span className="rk">{rank}</span>
                                <span className="nm">{meta.name}</span>
                                <span className="sc">
                                  {formatNumber(board[rank - 1]?.score ?? 0)}
                                </span>
                              </li>
                            )}
                          </ol>
                          <button
                            className="proto-board-more"
                            {...sfx}
                            onClick={() => setScreen("board")}
                          >
                            {t("board.seeAll")}
                          </button>
                        </>
                      ) : (
                        <p className="proto-empty">{t("board.empty")}</p>
                      )}
                    </>
                  )}
                </section>

                <section className="proto-sec proto-actions">
                  <button className="proto-btn" onClick={requestPlay} {...sfx}>
                    {t("summary.replay")}
                  </button>
                  {/* The armed list used to live on the menu only — a screen you never
                      return to once you are in the run/lottery/summary loop. So a gift
                      was won and spent without ever being seen. It belongs here. */}
                  {armedNames.length > 0 && (
                    <p className="proto-armed proto-armed--next">
                      {t("summary.thisRun", { list: armedNames.join(" · ") })}
                    </p>
                  )}
                  <div className="proto-actions-row">
                    <button
                      className="proto-btn-ghost"
                      onClick={() => setScreen("shop")}
                      {...sfx}
                    >
                      {t("menu.shop")} · ✦ {meta.dust}
                    </button>
                    <button
                      className="proto-btn-ghost"
                      {...sfx}
                      onClick={async () => {
                        // Shared in the language the player is playing in — the link goes
                        // to whoever they play with, who most likely speaks it too
                        const text = t("share.text", {
                          m: stats.altitudeM,
                          rank: rank ? t("share.rank", { n: rank }) : "",
                        });
                        try {
                          if (navigator.share) {
                            await navigator.share({
                              title: "Rainbow Racer",
                              text,
                              url: location.href,
                            });
                          } else {
                            await navigator.clipboard.writeText(`${text} ${location.href}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1800);
                          }
                        } catch {
                          /* share sheet dismissed */
                        }
                      }}
                    >
                      {copied ? t("share.copied") : t("share.label")}
                    </button>
                  </div>
                  {/* The end of a run is where you actually feel that something was too
                      small to see, so the knobs are one tap away from here too. */}
                  <button
                    className="proto-reset"
                    onClick={() => setScreen("settings")}
                    {...sfx}
                  >
                    {t("settings.open")}
                  </button>
                </section>
              </>
            )}


            {screen === "board" && (
              <>
                <section className="proto-sec">
                  <h3>{t("board.title")}</h3>
                  {board.length > 0 ? (
                    <ol className="proto-fullboard">
                      {board.map((e, i) => (
                        <li key={i} className={e.name === meta.name ? "me" : ""}>
                          <span className="rk">{i + 1}</span>
                          <span className="nm">{e.name}</span>
                          <span className="sc">{formatNumber(e.score)}</span>
                          <span className="ds">{e.distance} m</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="proto-empty">{t("board.empty")}</p>
                  )}
                  <p className="proto-empty">{t("board.weekly")}</p>
                </section>
                <button
                  className="proto-btn"
                  {...sfx}
                  onClick={() => setScreen(stats ? "summary" : "menu")}
                >
                  {t("board.back")}
                </button>
              </>
            )}
            {screen === "settings" && (
              <SettingsScreen
                onBack={() => setScreen(stats ? "summary" : "menu")}
                onHowto={() => {
                  setHowtoReturn("settings");
                  setScreen("howto");
                }}
              />
            )}

            {screen === "howto" && (
              <HowtoScreen
                onStart={() => {
                  if (howtoReturn) {
                    setScreen(howtoReturn);
                    setHowtoReturn(null);
                  } else {
                    play();
                  }
                }}
              />
            )}

            {screen === "shop" && (
              <>
                <p className="proto-lottery-title">{t("shop.title")}</p>
                <p className="proto-dust">
                  <ShopIcon id="dust" size={18} /> {t("shop.dust", { n: meta.dust })}
                </p>
                <div className="proto-shop">
                  {(["permanent", "consumable", "mode"] as const).map((kind) => (
                    <div key={kind} className="proto-shop-group">
                      <h4>{t(`shop.${kind}`)}</h4>
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
                            <span className="proto-item-name">{itemName(u.id)}</span>
                            <span className="proto-item-price">
                              {has
                                ? t("shop.owned")
                                : active
                                  ? t("shop.active")
                                  : `✦ ${u.price}`}
                            </span>
                            <span className="proto-item-blurb">{itemBlurb(u.id)}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <button className="proto-btn" onClick={requestPlay} {...sfx}>
                  {t("menu.play")}
                </button>
                <button
                  className="proto-reset"
                  onClick={() => {
                    if (confirm(t("shop.resetConfirm"))) {
                      setMeta(resetMeta());
                    }
                  }}
                >
                  {t("shop.reset")}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
