"use client";

// Phase 0 harness. Deliberately ugly: the only thing being tested is the swing.

import { useCallback, useEffect, useRef, useState } from "react";

import { ProtoEngine, ProtoStats } from "@/game/v3/proto.engine";

export default function ProtoShell() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ProtoEngine | null>(null);
  const [stats, setStats] = useState<ProtoStats | null>(null);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(0);

  const handleEnd = useCallback((s: ProtoStats) => {
    engineRef.current?.destroy();
    engineRef.current = null;
    setStats(s);
    setRunning(false);
    setBest((b) => Math.max(b, s.altitudeM));
  }, []);

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    engineRef.current?.destroy();
    setStats(null);
    setRunning(true);
    const engine = new ProtoEngine(canvas, handleEnd);
    engineRef.current = engine;
    engine.start();
  }, [handleEnd]);

  useEffect(() => () => engineRef.current?.destroy(), []);

  // Enter restarts between runs; Space is reserved for the game itself
  useEffect(() => {
    if (running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter") {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, start]);

  return (
    <div className="proto-shell">
      {/* Desktop surround: the play area is portrait, so wide screens get a backdrop
          and a legend instead of dead black space either side. */}
      <aside className="proto-aside">
        <p className="proto-aside-title">Phase 0 — L&apos;Arc</p>
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
          <dt>Treuil</dt>
          <dd>la qualité de ton dernier lâcher paie le suivant</dd>
        </dl>
        <p className="proto-aside-note">
          Rectangles blancs sur fond noir&nbsp;: aucun habillage, pour ne juger que la
          sensation du balancier.
        </p>
      </aside>

      <div className="proto-stage">
        {/* No width/height props: the engine sizes the backing buffer from the real CSS
            box so the view is never stretched. React must not fight it on re-render. */}
        <canvas ref={canvasRef} className="proto-canvas" />

        {!running && (
          <div className="proto-overlay">
            {stats ? (
              <>
                <p className="proto-alt">{stats.altitudeM} m</p>
                <ul className="proto-stats">
                  <li>chaîne max <b>{stats.bestChain}</b></li>
                  <li>accroches <b>{stats.attaches}</b></li>
                  <li>ailes <b>{stats.flaps}</b></li>
                  <li>temps <b>{stats.timeSurvived}s</b></li>
                </ul>
                {stats.pureFlight && stats.altitudeM > 50 && (
                  <p className="proto-pure">VOL PUR — zéro battement d&apos;ailes</p>
                )}
                {best > 0 && <p className="proto-best">record de la session : {best} m</p>}
                <button className="proto-btn" onClick={start}>Rejouer <small>(Entrée)</small></button>
              </>
            ) : (
              <>
                <p className="proto-title">PHASE 0<br />L&apos;ARC</p>
                <ul className="proto-rules">
                  <li><b>Appuie</b> près d&apos;une ancre pour t&apos;y accrocher</li>
                  <li><b>Maintiens</b> — la corde s&apos;enroule, tu montes</li>
                  <li><b>Lâche</b> au bon moment pour être catapulté</li>
                  <li>Loin de toute ancre, appuyer = un battement d&apos;ailes</li>
                </ul>
                <button className="proto-btn" onClick={start}>Commencer</button>
                <p className="proto-note">
                  Aucun habillage, c&apos;est voulu. La seule question&nbsp;: est-ce que
                  se balancer est déjà amusant&nbsp;?
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
