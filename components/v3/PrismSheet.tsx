"use client";

// A character sheet. Prism is ~55px tall in play, which is too small to judge a design
// against, and catching each state in a live run means playing well enough to reach it.
// This renders every state side by side and large, on each altitude band's sky, so the
// character can be critiqued directly.

import { useEffect, useRef } from "react";
import { BANDS, skyAt } from "@/game/v3/art/palette";
import { drawPrism, drawTether, prismGrip, PrismPose } from "@/game/v3/art/draw";

interface Cell {
  label: string;
  note: string;
  pose: (t: number) => Omit<PrismPose, "light" | "time">;
  tether?: boolean;
}

const CELLS: Cell[] = [
  {
    label: "Montée",
    note: "ailes qui battent, jambes repliées",
    pose: () => ({
      vx: 90, vy: 560, scale: 3, tumbling: 0, tethered: false, hangAngle: null,
      flapPulse: 0.85, justAttached: 0, justReleased: 0,
    }),
  },
  {
    label: "Vol plané",
    note: "bras écartés, ailes tendues",
    pose: () => ({
      vx: 240, vy: -420, scale: 3, tumbling: 0, tethered: false, hangAngle: null,
      flapPulse: 0, justAttached: 0, justReleased: 0,
    }),
  },
  {
    label: "Accrochée",
    note: "bras en l\u2019air, le corps pend sous la corde",
    pose: () => ({
      vx: 480, vy: 120, scale: 3, tumbling: 0, tethered: true, hangAngle: -1.05,
      flapPulse: 0, justAttached: 0, justReleased: 0,
    }),
    tether: true,
  },
  {
    label: "Au lâcher",
    note: "ailes grandes ouvertes, anneau de lumière",
    pose: () => ({
      vx: 120, vy: 780, scale: 3, tumbling: 0, tethered: false, hangAngle: null,
      flapPulse: 0.4, justAttached: 0, justReleased: 0.75,
    }),
  },
  {
    label: "À l'accroche",
    note: "recul du corps, une seconde de compression",
    pose: () => ({
      vx: 300, vy: 200, scale: 3, tumbling: 0, tethered: true, hangAngle: -1.3,
      flapPulse: 0, justAttached: 0.9, justReleased: 0,
    }),
    tether: true,
  },
  {
    label: "Étourdie",
    note: "elle vrille, l'œil se ferme",
    pose: () => ({
      vx: -60, vy: -300, scale: 3, tumbling: 0.3, tethered: false, hangAngle: null,
      flapPulse: 0, justAttached: 0, justReleased: 0,
    }),
  },
];

const W = 260;
const H = 260;

export default function PrismSheet() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      CELLS.forEach((cell, i) => {
        const canvas = refs.current[i];
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Each cell sits in a different band, so the rim light varies across the sheet
        const band = BANDS[i % BANDS.length];
        const sky = skyAt(band.fromM + 10);
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, sky.skyTop);
        g.addColorStop(1, sky.skyBottom);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        const pose: PrismPose = { ...cell.pose(t), light: sky.light, time: t };
        if (cell.tether) {
          const grip = prismGrip(pose);
          drawTether(ctx, W - 30, 24, W / 2 + grip.dx, H / 2 + grip.dy, sky.light, t);
        }
        drawPrism(ctx, W / 2, H / 2, pose);
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="sheet">
      <header>
        <h1>Prism</h1>
        <p>
          Chaque état, en grand. Tout est dessiné à l&apos;image&nbsp;: silhouette facettée,
          lumière du palier d&apos;altitude, crinière et corde dans la même matière.
        </p>
      </header>
      <div className="sheet-grid">
        {CELLS.map((c, i) => (
          <figure key={c.label}>
            <canvas
              ref={(el) => {
                refs.current[i] = el;
              }}
              width={W}
              height={H}
            />
            <figcaption>
              <b>{c.label}</b>
              <span>{c.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
